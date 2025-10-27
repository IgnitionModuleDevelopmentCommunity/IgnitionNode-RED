import React, { useState } from "react";
import {
  Card,
  FormControlInput,
  Checkbox,
  TextArea,
  TextInput,
} from "@inductiveautomation/ignition-web-ui";
import { getNodeREDPageStyles } from "../_NodeRED.styles";

const TokenForm = ({ isEdit }: { isEdit: boolean }) => {
  const [secretEnabled, setSecretEnabled] = useState(false);

  const {
    classes: { scDrawerCard },
  } = getNodeREDPageStyles();

  return (
    <div>
      <Card title={"GENERAL"} className={scDrawerCard} required={true}>
        {!isEdit && (
          <FormControlInput
            input={<TextInput />}
            name={"name"}
            id={"name"}
            label={"Name *"}
          />
        )}
        <FormControlInput
          input={<TextArea />}
          name={"description"}
          id={"description"}
          label={"Description"}
        />
        <FormControlInput
          input={
            <Checkbox label={"Sets whether the token is enabled or disabled"} />
          }
          name={"enabled"}
          id={"enabled"}
          label={"Enabled"}
        />
      </Card>
      <Card title={"TOKEN CONFIGURATION"} required={true}>
        <FormControlInput
          input={<TextArea />}
          name={"config.APIToken"}
          id={"token"}
          label={"Token *"}
        />
        {isEdit && (
          <>
            <FormControlInput
              label={"Change Secret"}
              input={
                <Checkbox
                  label={"Check this box to change the existing secret"}
                  id={"change-secret-checkbox"}
                  defaultValue={secretEnabled}
                  onChange={() => setSecretEnabled(!secretEnabled)}
                />
              }
              name={"config.changeSecret"}
              id={"change-secret"}
            />
            <FormControlInput
              disabled={!secretEnabled}
              indent={true}
              input={<TextInput type={"password"} />}
              name={"config.Secret"}
              id={"secret"}
              label={"Secret"}
            />
            <FormControlInput
              disabled={!secretEnabled}
              indent={true}
              input={<TextInput type={"password"} />}
              name={"config.confirmSecret"}
              id={"confirm-secret"}
              label={"Confirm Secret"}
              description={"Re-type secret for verification."}
            />
          </>
        )}
        {!isEdit && (
          <>
            <FormControlInput
              input={<TextInput type={"password"} />}
              name={"config.Secret"}
              id={"secret"}
              label={"Secret *"}
            />
            <FormControlInput
              input={<TextInput type={"password"} />}
              name={"config.confirmSecret"}
              id={"confirm-secret"}
              label={"Confirm Secret *"}
              description={"Re-type secret for verification"}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default TokenForm;
