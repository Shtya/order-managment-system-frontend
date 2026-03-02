'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Image as ImageIcon,
  FileText,
  Film,
  Music,
  FileArchive,
  File,
  Loader2,
  Copy,
  Trash2,
  Check,
  Grid3x3,
  List,
  AlertCircle,
  X,
} from 'lucide-react';

import { useTranslations } from 'next-intl';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/utils/cn';

import api, { BASE_URL } from '@/utils/api';
import toast from 'react-hot-toast';

/* =========================
  Helpers
========================= */

const normalizeAxiosError = (err, fallback) => {
  const msg =
    err?.response?.data?.message ??
    err?.response?.data?.error ??
    err?.message ??
    fallback ??
    'Unexpected error';
  return Array.isArray(msg) ? msg.join(', ') : String(msg);
};

const getFileIcon = (mimeType) => {
  if (!mimeType) return File;
  if (mimeType.startsWith('image/')) return ImageIcon;
  if (mimeType.startsWith('video/')) return Film;
  if (mimeType.startsWith('audio/')) return Music;
  if (mimeType.includes('pdf')) return FileText;
  if (
    mimeType.includes('zip') ||
    mimeType.includes('rar') ||
    mimeType.includes('tar')
  )
    return FileArchive;
  return File;
};

const isImage = (mimeType) => mimeType?.startsWith('image/');

const safeUrl = (asset) => {
  const raw = asset?.url || '';
  if (!raw) return '';
  if (raw.startsWith('http')) return raw;
  return `${String(BASE_URL || '').replace(/\/+$/, '')}/${String(raw).replace(/^\/+/, '')}`.replace(
    /([^:]\/)\/+/g,
    '$1'
  );
};

const fileExt = (asset) => {
  const mt = asset?.mimeType || '';
  const part = mt.split('/')[1] || '';
  return (part || 'FILE').toUpperCase();
};

/* =========================
  MediaLibrary
========================= */

export function MediaLibrary({
  open,
  onOpenChange,
  onSelectAsset,
  multiple = false,
}) {
  const t = useTranslations('mediaLibrary');

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // removed search per request
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [copiedId, setCopiedId] = useState(null);

  const [isDragging, setIsDragging] = useState(false);

  // delete modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null); // asset
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) loadAssets();
    if (open) setSelectedIds(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/assets');
      setAssets(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load assets:', error);
      toast.error(t('toast.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedAssets = [];

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('filename', file.name);

        const response = await api.post('/assets', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        uploadedAssets.push(response.data);
      }

      toast.success(t('toast.uploaded', { count: uploadedAssets.length }));
      await loadAssets();
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(normalizeAxiosError(error, t('toast.uploadFailed')));
    } finally {
      setUploading(false);
    }
  };

  const handleBulkUpload = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      await api.post('/assets/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(t('toast.uploaded', { count: files.length }));
      await loadAssets();
    } catch (error) {
      console.error('Bulk upload failed:', error);
      toast.error(normalizeAxiosError(error, t('toast.uploadFailed')));
    } finally {
      setUploading(false);
    }
  };

  const onFileInputChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 1) handleBulkUpload(files);
    else handleFileUpload(files);
    e.target.value = '';
  };

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files || []);
      if (!files.length) return;

      if (files.length > 1) handleBulkUpload(files);
      else handleFileUpload(files);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const copyUrl = async (asset) => {
    const url = safeUrl(asset);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(asset.id);
      toast.success(t('toast.copied'));
      setTimeout(() => setCopiedId(null), 1600);
    } catch {
      toast.error(t('toast.copyFailed'));
    }
  };

  const requestDelete = (asset) => {
    setPendingDelete(asset);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete?.id) return;

    setDeleting(true);
    try {
      await api.delete(`/assets/${pendingDelete.id}`);
      toast.success(t('toast.deleted'));

      setAssets((prev) => prev.filter((a) => a.id !== pendingDelete.id));

      // remove from selection
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(pendingDelete.id);
        return next;
      });

      setDeleteOpen(false);
      setPendingDelete(null);
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(normalizeAxiosError(error, t('toast.deleteFailed')));
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelect = (asset) => {
    const id = asset.id;
    if (!multiple) {
      const url = safeUrl(asset);
      onSelectAsset?.(url, asset);
      onOpenChange(false);
      return;
    }

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedAssets = useMemo(() => {
    if (!multiple) return [];
    const map = new Map(assets.map((a) => [a.id, a]));
    return Array.from(selectedIds)
      .map((id) => map.get(id))
      .filter(Boolean);
  }, [assets, selectedIds, multiple]);

  const confirmMultipleSelect = () => {
    if (!multiple) return;

    const picked = selectedAssets.map((a) => ({
      url: safeUrl(a),
      asset: a,
    }));

    onSelectAsset?.(
      picked.map((p) => p.url),
      picked.map((p) => p.asset)
    );

    onOpenChange(false);
  };

  // search removed -> no filter
  const shownAssets = assets;

  const emptyTitle = t('empty.noAssetsTitle');
  const emptyDesc = t('empty.noAssetsDesc');

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!w-full !max-w-4xl !z-[100] h-[84vh] flex flex-col p-0 overflow-hidden">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-2xl font-bold tracking-tight">
                  {t('title')}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {t('description')}
                </DialogDescription>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="rounded-full"
                aria-label={t('actions.close')}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Toolbar */}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                {multiple && (
                  <Badge variant="secondary" className="h-9 px-3 rounded-full">
                    {t('selectedCount', { count: selectedIds.size })}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-full border bg-white dark:bg-slate-950 overflow-hidden">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'rounded-none',
                      viewMode === 'grid' && 'bg-slate-100 dark:bg-slate-900'
                    )}
                    aria-label={t('view.grid')}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'rounded-none',
                      viewMode === 'list' && 'bg-slate-100 dark:bg-slate-900'
                    )}
                    aria-label={t('view.list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Body */}
          <div
            className="relative flex-1 overflow-hidden"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {/* Drag overlay */}
            {isDragging && (
              <div className="absolute inset-0 z-10 bg-primary/10 backdrop-blur-sm flex items-center justify-center">
                <div className="rounded-xl border border-dashed border-primary/40 bg-white/80 dark:bg-slate-950/70 px-6 py-5 text-center shadow-xl">
                  <div className="mx-auto w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-primary" />
                  </div>
                  <p className="mt-3 font-semibold">{t('dropOverlay.title')}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t('dropOverlay.subtitle')}
                  </p>
                </div>
              </div>
            )}

            <div className="h-full overflow-y-auto px-6 py-5">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Upload tile */}
                  <div className="mb-5">
                    <div
                      className={cn(
                        'relative rounded-xl border border-dashed p-5',
                        'bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900',
                        'hover:border-primary/50 transition-colors'
                      )}
                    >
                      <input
                        type="file"
                        multiple
                        onChange={onFileInputChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploading}
                        aria-label={t('upload.aria')}
                      />

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pointer-events-none">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            {uploading ? (
                              <Loader2 className="w-6 h-6 text-primary animate-spin" />
                            ) : (
                              <Upload className="w-6 h-6 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {uploading ? t('upload.uploading') : t('upload.title')}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {t('upload.subtitle')}
                            </p>
                          </div>
                        </div>

                        <Badge variant="secondary" className="self-start sm:self-auto">
                          {t('upload.hint')}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Empty state */}
                  {shownAssets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[55vh] text-center">
                      <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                        <AlertCircle className="w-10 h-10 text-slate-400" />
                      </div>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">
                        {emptyTitle}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {emptyDesc}
                      </p>
                    </div>
                  ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,265px))] gap-4">
                      {shownAssets.map((asset, idx) => (
                        <AssetCard
                          key={asset.id}
                          asset={asset}
                          index={idx}
                          multiple={multiple}
                          selected={selectedIds.has(asset.id)}
                          onSelect={() => toggleSelect(asset)}
                          onCopy={() => copyUrl(asset)}
                          onDelete={() => requestDelete(asset)}
                          copied={copiedId === asset.id}
                          t={t}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {shownAssets.map((asset, idx) => (
                        <AssetRow
                          key={asset.id}
                          asset={asset}
                          index={idx}
                          multiple={multiple}
                          selected={selectedIds.has(asset.id)}
                          onSelect={() => toggleSelect(asset)}
                          onCopy={() => copyUrl(asset)}
                          onDelete={() => requestDelete(asset)}
                          copied={copiedId === asset.id}
                          t={t}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t px-6 py-4 bg-white dark:bg-slate-950">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {multiple ? t('footer.multiHint') : t('footer.singleHint')}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  {t('actions.cancel')}
                </Button>

                {multiple ? (
                  <Button onClick={confirmMultipleSelect} disabled={selectedIds.size === 0}>
                    {t('actions.insertSelected', { count: selectedIds.size })}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </DialogContent>


 				<AlertDialog
        open={deleteOpen}
        onOpenChange={(v) => {
          if (deleting) return;
          setDeleteOpen(v);
          if (!v) setPendingDelete(null);
        }}
				className=""
      >
        <AlertDialogContent className="rounded-xl !z-[100] ">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete.description')}
              {pendingDelete?.filename ? (
                <span className="block mt-2 text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">{pendingDelete.filename}</span>
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {t('actions.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('delete.deleting')}
                </span>
              ) : (
                t('delete.confirm')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
       </Dialog>
 
    </>
  );
}

/* =========================
  Tiles
========================= */

function AssetCard({
  asset,
  index,
  multiple,
  selected,
  onSelect,
  onCopy,
  onDelete,
  copied,
  t,
}) {
  const [imageError, setImageError] = useState(false);
  const Icon = getFileIcon(asset.mimeType);
  const isImg = isImage(asset.mimeType) && !imageError;
  const assetUrl = safeUrl(asset);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03, duration: 0.18 }}
      className="group relative"
    >
      <Card
        className={cn(
          ' !h-fit relative overflow-hidden cursor-pointer transition-all duration-200',
          'hover:shadow-xl !pb-0 hover:scale-[1.02] hover:border-primary/40',
          'border-2',
          selected ? 'border-primary/60 shadow-md' : 'border-transparent'
        )}
        onClick={onSelect}
      >
        {/* Preview */}
        <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center overflow-hidden">
          {isImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={assetUrl}
              alt={asset.filename}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <Icon className="w-12 h-12 text-slate-400" />
          )}
        </div>
 

        {/* Filename */}
        <div className="p-3 border-t">
          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
            {asset.filename}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {asset.mimeType || t('labels.unknownType')}
          </p>
        </div>

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/90 hover:bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy();
                  }}
                  aria-label={t('actions.copyUrl')}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{copied ? t('tooltips.copied') : t('tooltips.copyUrl')}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/90 hover:bg-white hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  aria-label={t('actions.delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('tooltips.delete')}</p>
              </TooltipContent>
            </Tooltip>

            {multiple && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect();
                    }}
                    aria-label={selected ? t('actions.unselect') : t('actions.select')}
                  >
                    {selected ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{selected ? t('tooltips.unselect') : t('tooltips.select')}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </Card>
    </motion.div>
  );
}

function AssetRow({
  asset,
  index,
  multiple,
  selected,
  onSelect,
  onCopy,
  onDelete,
  copied,
  t,
}) {
  const [imageError, setImageError] = useState(false);
  const Icon = getFileIcon(asset.mimeType);
  const isImg = isImage(asset.mimeType) && !imageError;
  const assetUrl = safeUrl(asset);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.15 }}
    >
      <Card
        className={cn(
          'flex items-center gap-3 p-3 cursor-pointer transition-colors',
          'hover:bg-slate-50 dark:hover:bg-slate-900',
          selected && 'border-primary/60'
        )}
        onClick={onSelect}
      >
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 overflow-hidden flex items-center justify-center shrink-0">
          {isImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={assetUrl}
              alt={asset.filename}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <Icon className="w-6 h-6 text-slate-400" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <p className="font-medium truncate">{asset.filename}</p>
            <Badge variant="secondary" className="shrink-0">
              {fileExt(asset)}
            </Badge>
            {selected && <Badge className="shrink-0">{t('badges.selected')}</Badge>}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {asset.mimeType || t('labels.unknownType')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            aria-label={t('actions.copyUrl')}
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label={t('actions.delete')}
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          {multiple ? (
            <Button
              type="button"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
            >
              {selected ? t('actions.unselect') : t('actions.select')}
            </Button>
          ) : null}
        </div>
      </Card>
    </motion.div>
  );
}

export default MediaLibrary;
