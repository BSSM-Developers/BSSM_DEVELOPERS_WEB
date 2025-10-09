
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
    text: "#11111",
    border: "#E5E7EB",
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