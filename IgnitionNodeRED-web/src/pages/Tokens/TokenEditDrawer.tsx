import React from "react";
import {
  Drawer,
  DrawerTemplate,
  DrawerTemplateColorTheme,
  DrawerTemplateSize,
  Form,
} from "@inductiveautomation/ignition-web-ui";
import { UseFormReturn } from "react-hook-form";
import { getNodeREDPageStyles } from "../_NodeRED.styles";
import TokenForm from "./TokenForm";

export interface TokenEditDrawerProps {
  open: boolean;
  onClose(): void;
  onComplete?(): void;
  tokenName: string | undefined;
  context: UseFormReturn;
  isDisabled: boolean;
}

const TokenEditDrawer = ({
  open,
  onClose,
  onComplete,
  tokenName,
  context,
  isDisabled,
}: TokenEditDrawerProps) => {
  const {
    classes: { scForm, scFormRoot },
  } = getNodeREDPageStyles();

  const {
    formState: { isValid },
  } = context;

  return (
    <Drawer open={open} anchor={"right"} id={`drawer-${tokenName}`}>
      <DrawerTemplate
        path={[`Edit ${tokenName}`]}
        size={DrawerTemplateSize.SMALL}
        onClose={onClose}
        onCancel={onClose}
        onComplete={onComplete}
        primaryActionText={"Save Changes"}
        primaryDisabled={!isValid || isDisabled}
        secondaryActionText={"Cancel"}
        theme={DrawerTemplateColorTheme.GREY}
      >
        <div className={scForm}>
          <Form
            context={context}
            id="form-collector-edit"
            className={scFormRoot}
          >
            <TokenForm isEdit={true} />
          </Form>
        </div>
      </DrawerTemplate>
    </Drawer>
  );
};

export default TokenEditDrawer;
