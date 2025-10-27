import { yup } from "@inductiveautomation/ignition-web-ui";
import { FieldValues } from "react-hook-form";

export interface TokenConfig {
  APIToken: string;
  Secret: string;
  storedSecret: any;
  AuditProfile: string;
  SecurityLevels: string;
  Roles: string;
  Zones: string;
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
      APIToken: yup
        .string()
        .required("Token is required")
        .length(16, "Must be exactly 16 characters")
        .matches(/^[a-zA-Z0-9]+$/, "Must contain only alphanumeric characters"),
      Secret: yup.string().required("Secret is required"),
      changeSecret: yup.boolean(),
      confirmSecret: yup.string(),
      AuditProfile: yup.string().nullable(),
      SecurityLevels: yup.string(),
      Roles: yup.string(),
      Zones: yup.string(),
    }),
  });

  export const TokenDefaultValues: FieldValues = {
    name: "",
    enabled: true,
    signature: null,
    description: "",
    config: {
      APIToken: "",
      Secret: "",
      changeSecret: false,
      confirmSecret: "",
      AuditProfile: null,
      SecurityLevels: "",
      Roles: "",
      Zones: "",
    },
  };
}
