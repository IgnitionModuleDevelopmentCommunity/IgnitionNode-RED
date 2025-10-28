import { yup } from "@inductiveautomation/ignition-web-ui";
import { FieldValues } from "react-hook-form";

export interface TokenConfig {
  aPIToken: string;
  secret: string;
  storedSecret: any;
  auditProfile: string;
  securityLevels: string;
  roles: string;
  zones: string;
}

export interface TokenResource {
  name: string;
  enabled: boolean;
  signature: string;
  description: string;
  config: TokenConfig;
}

export namespace TokenUtils {
  export const TokenSchema: yup.ObjectSchema<FieldValues> = yup.object({
    name: yup.string().required(),
    enabled: yup.boolean(),
    description: yup.string(),
    signature: yup.string().nullable(),
    config: yup.object().shape({
      aPIToken: yup
        .string()
        .required("Token is required")
        .length(16, "Must be exactly 16 characters")
        .matches(/^[a-zA-Z0-9]+$/, "Must contain only alphanumeric characters"),
      secret: yup.string().required("Secret is required"),
      changeSecret: yup.boolean(),
      confirmSecret: yup.string(),
      auditProfile: yup.string().nullable(),
      securityLevels: yup.string(),
      roles: yup.string(),
      zones: yup.string(),
    }),
  });

  export const TokenDefaultValues: FieldValues = {
    name: "",
    enabled: true,
    signature: null,
    description: "",
    config: {
      aPIToken: "",
      secret: "",
      changeSecret: false,
      confirmSecret: "",
      auditProfile: null,
      securityLevels: "",
      roles: "",
      zones: "",
    },
  };
}
