export function createLocalizedMetadata({
  titleEn,
  titleAr,
  descriptionEn,
  descriptionAr,
  getMetadata,
}) {
  return async function generateMetadata({ params, searchParams }) {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;

    const locale = resolvedParams?.locale;
    const isArabic = locale === 'ar';

    const baseMetadata = {
      title: isArabic ? titleAr : titleEn,
      description: isArabic ? descriptionAr : descriptionEn,
    };

    if (getMetadata) {
      return {
        ...baseMetadata,
        ...(await getMetadata({
          locale,
          isArabic,
          searchParams: resolvedSearchParams,
        })),
      };
    }

    return baseMetadata;
  };
}