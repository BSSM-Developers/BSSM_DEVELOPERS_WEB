import { Theme } from "@emotion/react";

export interface CustomTheme {
  colors: {
    bssmGrey: string;
    bssmDarkBlue: string;
    bssmRed: string;
    bssmBlue: string;
    bssmYellow: string;
    bssmGreen: string;
    grey: {
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
    };
    background: string;
    text: string;
    border: string;
  };

  fontWeights: {
    thin: number;
    light: number;
    regular: number;
    medium: number;
    bold: number;
  };

  typography: {
    [key: string]: {
      fontSize: string;
      fontWeight?: keyof Theme["fontWeights"];
      lineHeight?: string;
      letterSpacing?: string;
      fontFamily?: string;
    };
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
}

export const lightTheme: CustomTheme = {
  colors: {
    bssmGrey: "#737C97",
    bssmDarkBlue: "#16335C",
    bssmRed: "#E6333F",
    bssmBlue: "#006AB7",
    bssmYellow: "#F3A941",
    bssmGreen: "#00A9A4",

    grey: {
      100: "#F2F4F6",
      200: "#E5E8EB",
      300: "#D1D6DB",
      400: "#B0B8C1",
      500: "#8B95A1",
      600: "#6B7684",
      700: "#4E5968",
      800: "#333D4B",
      900: "#191F28",
    },

    background: "#FFFFFF",
    text: "#000000",
    border: "#E5E7EB",
  },

  fontWeights: {
    thin: 100,
    light: 300,
    regular: 400,
    medium: 500,
    bold: 700,
  },

  typography: {
    Headline_1: {
      fontFamily: `"Spoqa Han Sans Neo", sans-serif`,
      fontWeight: "bold",
      fontSize: "42px",
      lineHeight: "120%",
      letterSpacing: "-0.5px",
    },
    Headline_2: {
      fontFamily: `"Spoqa Han Sans Neo", sans-serif`,
      fontSize: "30px",
      fontWeight: "medium",
      lineHeight: "130%",
      letterSpacing: "-0.5px",
    },
    Headline_3: {
      fontFamily: `"Spoqa Han Sans Neo", sans-serif`,
      fontSize: "42px",
      fontWeight: "medium",
      lineHeight: "130%",
      letterSpacing: "-0.5px",
    },
    Body_1: {
      fontFamily: `"Spoqa Han Sans Neo", sans-serif`,
      fontSize: "16px",
      fontWeight: "regular",
      lineHeight: "150%",
      letterSpacing: "-0.5px",
    },
    Body_2: {
      fontFamily: `"Spoqa Han Sans Neo", sans-serif`,
      fontSize: "14px",
      fontWeight: "regular",
      lineHeight: "150%",
      letterSpacing: "-0.5px",
    },
    Body_3: {
      fontFamily: `"Spoqa Han Sans Neo", sans-serif`,
      fontSize: "16px",
      fontWeight: "medium",
      lineHeight: "150%",
      letterSpacing: "-0.5px",
    },
    Body_4: {
      fontFamily: `"Spoqa Han Sans Neo", sans-serif`,
      fontSize: "14px",
      fontWeight: "medium",
      lineHeight: "150%",
      letterSpacing: "-0.5px",
    },
    Caption_1: {
      fontFamily: `"Spoqa Han Sans Neo", sans-serif`,
      fontSize: "18px",
      fontWeight: "regular",
      lineHeight: "140%",
    },
    Caption_2: {
      fontFamily: `"Spoqa Han Sans Neo", sans-serif`,
      fontSize: "28px",
      fontWeight: "medium",
      lineHeight: "140%",
      letterSpacing: "-0.5px",
    },
    Caption_3: {
      fontFamily: `"Spoqa Han Sans Neo", sans-serif`,
      fontSize: "28px",
      fontWeight: "light",
      lineHeight: "140%",
      letterSpacing: "-0.5px",
    },
    ButtonText_1: {
      fontSize: "20px",
      lineHeight: "120%",
      fontFamily: `"Flight Sans Bold", sans-serif`,
    },
    ButtonText_2: {
      fontSize: "14px",
      lineHeight: "120%",
      fontFamily: `"Flight Sans Bold", sans-serif`,
    },
    Docs_1: {
      fontFamily: `"Spoqa Han Sans Neo", sans-serif`,
      fontSize: "16px",
      fontWeight: "light",
      lineHeight: "160%",
      letterSpacing: "-0.5px",
    },
    Docs_2: {
      fontFamily: `"Spoqa Han Sans Neo", sans-serif`,
      fontSize: "20px",
      fontWeight: "light",
      lineHeight: "160%",
    },
  },
  borderRadius: {
    sm: "4px",
    md: "8px",
    lg: "12px",
  },
};

declare module "@emotion/react" {
  export interface Theme extends CustomTheme {}
}