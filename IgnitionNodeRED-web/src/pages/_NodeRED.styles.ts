import { utils } from "@inductiveautomation/ignition-web-ui";
const { makeStyles, getFontStyles } = utils;

export const getNodeREDPageStyles = makeStyles()((theme: any) => {
  const pxToRem = theme.typography.pxToRem;

  return {
    scTableContainer: {
      margin: "1.5rem 1.56rem",
      "& .scDrawer": {
        margin: "0",
      },
      "& .scTableHeader": {
        ...getFontStyles(theme, "h3Bold"),
        lineHeight: "2rem",
      },
      "& .scTableContainer": {
        marginTop: "0.5rem",
      },
    },
    scBlankStateContainer: {
      display: "flex",
      justifyContent: "center",
      marginTop: "6rem",
    },
    scFontRed: {
      color: "red",
    },
    scButtonMargin21: {
      marginTop: "21px",
    },
    scForm: {
      padding: "1rem",
    },
    scForm500: {
      padding: "1rem",
      maxHeight: "500px",
      overflow: "auto",
    },
    scDrawerCard: {
      marginBottom: "1rem",
    },
    scFormCols: {
      display: "flex",
      gap: "20px",
    },
    scFormColsMargin: {
      display: "flex",
      gap: "20px",
      marginTop: "1.5rem",
    },
    scFormCol: {
      flex: "1",
      marginTop: "0px",
    },
    scFormColAuto: {
      flex: "0 0 auto",
      marginTop: "0px",
    },
    scFormColLarge: {
      flex: "4",
      marginTop: "0px",
    },
    scFormRoot: {
      display: "flex",
      flexDirection: "column",
      'div[class*="-formInput"]:not([class*="-scFormCol"])': {
        "&:not(:first-of-type)": {
          marginTop: "1.5rem",
        },
        '&[data-indent="true"]': {
          marginTop: "0.5rem",
        },
      },
    },
    scModalTitle: {
      display: "flex",
      justifyContent: "center",
      position: "relative",
      height: pxToRem(56),
      alignItems: "center",
      borderBottom: `${pxToRem(1)} solid ${theme.palette.neutral[20]}`,

      ".title": {
        margin: 0,
        ...getFontStyles(theme, "h1Medium"),
      },

      button: {
        all: "unset",
        position: "absolute",
        right: 0,
        marginRight: pxToRem(20),
        display: "flex",
        justifyContent: "center",
        cursor: "pointer",

        svg: {
          fontSize: pxToRem(24),
          color: theme.palette.primary.mainVar,
        },
      },
    },
    scModal: {
      display: "flex",
      flexDirection: "column",
      ".MuiAlert-root": {
        borderRadius: "0",
      },
      ".form-content": {
        maxHeight: "26.125rem",
        overflow: "auto",
      },
    },
    scModalFooter: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      padding: "1rem",
      borderTop: `1px solid ${theme.palette.neutral[20]}`,
    },
    scDeleteButton: {
      color: theme.palette.error.mainVar,
      "&disabled": {
        color: theme.palette.neutral[40],
      },
    },
  };
});
