import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !["zh", "en"].includes(locale as string)) locale = "zh";
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
