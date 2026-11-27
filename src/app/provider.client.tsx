"use client";

import * as React from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { NextIntlClientProvider } from "next-intl";
import { useRouter } from "next/navigation";
import type { AbstractIntlMessages } from "use-intl/core";
import { ThemeProvider } from "@bloomper/fgv-web-ui/shell/theme-provider";
import { Toaster } from "@bloomper/fgv-web-ui/ui/sonner";
import { ConsentManager } from "@/components/consent-manager.client";
import { FormValidation } from "@/components/form-validation.client";
import { withFgvMessages } from "@bloomper/fgv-web-ui/messages";
import { FgvShellProvider } from "@bloomper/fgv-web-ui/shell/shell-provider";
import { track } from "@/utils/umami";

type LocaleContextValue = {
  locale: string;
  changeLocale: (locale: string) => Promise<void>;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export const useLocaleContext = () => {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocaleContext must be used within <Provider />");
  }
  return ctx;
};

export default function Provider({
  children,
  locale: initialLocale,
  messages: initialMessages,
}: Readonly<{
  children: React.ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
}>) {
  const router = useRouter();
  const [locale, setLocale] = useState(initialLocale);
  const [messages, setMessages] = useState(initialMessages);

  const changeLocale = useCallback(
    async (newLocale: string) => {
      document.cookie = `locale=${newLocale}; path=/; max-age=31536000; samesite=lax`;

      const newMessages = withFgvMessages(newLocale, (await import(`../../messages/${newLocale}.json`)).default);

      setLocale(newLocale);
      setMessages(newMessages);
      router.refresh();
    },
    [router]
  );

  useEffect(() => {
    document.documentElement.lang = locale;

    const title = (messages as { Meta?: { title?: string } })?.Meta?.title;

    if (title) {
      document.title = title;
    }
  }, [locale, messages]);

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone="Europe/Stockholm"
    >
      <LocaleContext.Provider value={{ locale, changeLocale }}>
        <FgvShellProvider
          changeLocale={changeLocale}
          track={track}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ConsentManager>
              {children}
              <Toaster />
              <FormValidation />
            </ConsentManager>
          </ThemeProvider>
        </FgvShellProvider>
      </LocaleContext.Provider>
    </NextIntlClientProvider>
  );
}
