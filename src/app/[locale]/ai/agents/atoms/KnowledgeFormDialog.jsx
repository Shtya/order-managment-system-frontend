"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { BookOpen, Edit, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import api from "@/utils/api";
import { normalizeAxiosError } from "@/utils/axios";

const knowledgeSchema = (t) =>
  yup.object({
    title: yup
      .string()
      .trim()
      .required(t("knowledge.validation.titleRequired"))
      .max(255),
    content: yup
      .string()
      .trim()
      .required(t("knowledge.validation.contentRequired"))
      .max(2000),
    isActive: yup.boolean().default(true),
  });

export default function KnowledgeFormDialog({
  open,
  onOpenChange,
  knowledge,
  onSuccess,
  showAssign = true,
}) {
  const t = useTranslations("agents");
  const schema = useMemo(() => knowledgeSchema(t), [t]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: "",
      content: "",
      isActive: true,
    },
  });

  const [assignMode, setAssignMode] = useState("all");
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [checkedAgentIds, setCheckedAgentIds] = useState([]);

  useEffect(() => {
    if (!open) return;
    reset({
      title: knowledge?.title || "",
      content: knowledge?.content || "",
      isActive: knowledge?.isActive ?? true,
    });
    setAssignMode("all");
    setCheckedAgentIds([]);
    if (knowledge?.id) return;
    let cancelled = false;
    const fetchAgents = async () => {
      setAgentsLoading(true);
      try {
        const res = await api.get("/agents", { params: { limit: 100 } });
        if (!cancelled) {
          setAgents(Array.isArray(res.data?.records) ? res.data.records : []);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(normalizeAxiosError(error) || t("toast.fetchFailed"));
        }
      } finally {
        if (!cancelled) setAgentsLoading(false);
      }
    };
    fetchAgents();
    return () => {
      cancelled = true;
    };
  }, [open, knowledge, reset, t]);

  const toggleAgent = (id, checked) => {
    setCheckedAgentIds((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }
      return prev.filter((agentId) => agentId !== id);
    });
  };

  const onSubmit = async (values) => {
    const payload = {
      title: values.title.trim(),
      content: values.content.trim(),
      isActive: values.isActive,
    };
    if (!knowledge?.id) {
      if (assignMode === "all") {
        payload.agentIds = agents.map((agent) => agent.id);
      } else if (assignMode === "selected" && checkedAgentIds.length) {
        payload.agentIds = checkedAgentIds;
      }
    }
    try {
      if (knowledge?.id) {
        await api.patch(`/agents/knowledge/${knowledge.id}`, payload);
        toast.success(t("knowledge.toast.updated"));
      } else {
        await api.post("/agents/knowledge", payload);
        toast.success(t("knowledge.toast.created"));
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(normalizeAxiosError(error) || t("knowledge.toast.saveFailed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-full p-0 overflow-hidden bg-white dark:bg-slate-950">
        <DialogHeader className="px-4 md:px-6 py-4 border-b border-border bg-card">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
              {knowledge ? <Edit size={20} /> : <BookOpen size={20} />}
            </div>
            {knowledge ? t("knowledge.form.editTitle") : t("knowledge.form.createTitle")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-6 bg-card">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold" description={t("knowledge.form.titleDescription")}>
                {t("knowledge.form.title")}
              </Label>
              <Input
                {...register("title")}
                placeholder={t("knowledge.form.title")}
                className="rounded-xl h-[50px]"
              />
              {errors.title ? (
                <p className="text-xs text-red-600">{errors.title.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold" description={t("knowledge.form.contentDescription")}>
                {t("knowledge.form.content")}
              </Label>
              <Textarea
                {...register("content")}
                rows={6}
                maxLength={8000}
                placeholder={t("knowledge.form.contentPlaceholder")}
                className="rounded-xl"
              />
              {errors.content ? (
                <p className="text-xs text-red-600">{errors.content.message}</p>
              ) : null}
            </div>

            <div className="flex items-center gap-3 py-2">
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label className="text-sm font-semibold" description={t("knowledge.form.isActiveDescription")}>
                {t("knowledge.form.isActive")}
              </Label>
            </div>

            {!knowledge?.id && showAssign && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold" description={t("knowledge.form.assignDescription")}>
                  {t("knowledge.form.assign")}
                </Label>
                <Select value={assignMode} onValueChange={setAssignMode}>
                  <SelectTrigger className="h-[50px] rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("knowledge.form.assignNone")}</SelectItem>
                    <SelectItem value="all">{t("knowledge.form.assignAll")}</SelectItem>
                    <SelectItem value="selected">{t("knowledge.form.assignSelected")}</SelectItem>
                  </SelectContent>
                </Select>
                {assignMode === "selected" && (
                  <div className="border border-border rounded-xl max-h-[240px] overflow-y-auto divide-y divide-border">
                    {agentsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : agents.length ? (
                      agents.map((agent) => (
                        <label
                          key={agent.id}
                          className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={checkedAgentIds.includes(agent.id)}
                            onCheckedChange={(checked) => toggleAgent(agent.id, checked === true)}
                          />
                          <span className="text-sm font-medium text-foreground truncate flex-1">
                            {agent.name || "—"}
                          </span>
                          {!agent.isActive && (
                            <Badge variant="outline" className="shrink-0">
                              {t("status.inactive")}
                            </Badge>
                          )}
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        {t("knowledge.form.assignEmpty")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("knowledge.form.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t("knowledge.form.save")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
