import { useColorScheme, Appearance } from "react-native";
import Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";
import { Linking } from "react-native";
import i18n from "../lib/i18n";

export const useToolsFunctions = () => {
  const t = i18n.t;
  const timeFunction = () => {
    const now = new Date();
    return {
      success: true,
      time: now.toLocaleTimeString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      message: `${t("tools.time")}${now.toLocaleTimeString()} in ${
        Intl.DateTimeFormat().resolvedOptions().timeZone
      } timezone.`,
    };
  };

  const backgroundFunction = () => {
    try {
      const current = Appearance.getColorScheme();
      const newTheme = current === "dark" ? "light" : "dark";

      Toast.show({
        type: "success",
        text1: t("tools.switchTheme") + newTheme + ".",
      });

      // Note: Changing theme requires state/context-based theme switching in RN
      return {
        success: true,
        theme: newTheme,
        message: t("tools.switchTheme") + newTheme + ".",
      };
    } catch (error) {
      return {
        success: false,
        message: t("tools.themeFailed") + ": " + error,
      };
    }
  };

  const partyFunction = () => {
    // In your JSX return, render <ConfettiCannon ... /> when triggered
    Toast.show({
      type: "success",
      text1: t("tools.partyMode.toast") + " 🎉",
      text2: t("tools.partyMode.description"),
    });

    return {
      success: true,
      message: t("tools.partyMode.success") + " 🎉",
    };
  };

  const launchWebsite = ({ url }: { url: string }) => {
    Linking.openURL(url);

    Toast.show({
      type: "success",
      text1: t("tools.launchWebsite") + " 🌐",
      text2: t("tools.launchWebsiteSuccess") + url,
    });

    return {
      success: true,
      message: `Launched the site ${url}`,
    };
  };

  const copyToClipboard = ({ text }: { text: string }) => {
    Clipboard.setString(text);

    Toast.show({
      type: "success",
      text1: t("tools.clipboard.toast") + " 📋",
      text2: t("tools.clipboard.description"),
    });

    return {
      success: true,
      text,
      message: t("tools.clipboard.success"),
    };
  };

  const scrapeWebsite = async ({ url }: { url: string }) => {
    // You need to call your own backend API or a cloud function here
    return {
      success: false,
      message: `Web scraping is not supported directly in React Native. Use a backend API.`,
    };
  };

  return {
    timeFunction,
    backgroundFunction,
    partyFunction,
    launchWebsite,
    copyToClipboard,
    scrapeWebsite,
  };
};
