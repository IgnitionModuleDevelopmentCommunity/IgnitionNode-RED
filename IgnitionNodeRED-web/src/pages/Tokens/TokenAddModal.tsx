import React from "react";
import {
  Form,
  Button,
  ButtonColorClasses,
} from "@inductiveautomation/ignition-web-ui";
import { Close } from "@inductiveautomation/ignition-icons";
import { UseFormReturn } from "react-hook-form";
import { getNodeREDPageStyles } from "../_NodeRED.styles";
import TokenForm from "./TokenForm";

export interface TokenAddModalProps {
  close(): void;
  create(): void;
  context: UseFormReturn;
  isDisabled: boolean;
}

const TokenAddModal = ({
  close,
  create,
  context,
  isDisabled,
}: TokenAddModalProps) => {
  const {
    classes: { scModalTitle, scModal, scFormRoot, scModalFooter, scForm500 },
  } = getNodeREDPageStyles();

  const {
    formState: { isValid },
  } = context;

  return (
    <>
      <div className={scModalTitle}>
        <p className={"title"}>{"Create Token"}</p>

        <button>
          <Close
            onClick={close}
            data-icon={"close"}
            title={"close"}
            data-label="X"
          />
        </button>
      </div>
      <div className={scModal}>
        <div className={scForm500}>
          <Form
            onSubmit={create}
            context={context}
            id="token-add"
            className={scFormRoot}
          >
            <TokenForm isEdit={false} />
          </Form>
        </div>
        <div className={scModalFooter}>
          <Button colorClass={ButtonColorClasses.SECONDARY} onClick={close}>
            Cancel
          </Button>

          <Button
            colorClass={ButtonColorClasses.PRIMARY}
            onClick={create}
            disabled={!isValid || isDisabled}
          >
            {"Create Token"}
          </Button>
        </div>
      </div>
    </>
  );
};

export default TokenAddModal;
