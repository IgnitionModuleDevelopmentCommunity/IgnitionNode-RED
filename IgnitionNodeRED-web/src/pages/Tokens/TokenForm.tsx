import React, { useState } from "react";
import {
  Card,
  FormControlInput,
  Checkbox,
  TextArea,
  TextInput,
  SelectInput,
  SelectInputOption,
} from "@inductiveautomation/ignition-web-ui";
import useFetch from "../../utils/useFetch";
import { getNodeREDPageStyles } from "../_NodeRED.styles";

const TokenForm = ({ isEdit }: { isEdit: boolean }) => {
  const [secretEnabled, setSecretEnabled] = useState(false);

  const {
    classes: { scDrawerCard },
  } = getNodeREDPageStyles();

  const { data: auditProfiles } = useFetch(
    `/data/api/v1/resources/names/ignition/audit-profile`,
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );

  const auditProfileOptions: SelectInputOption[] =
    auditProfiles?.items
      ?.map((item: { name: string }) => {
        return { value: item.name, label: item.name };
      })
      .filter((item: any) => item) ?? [];

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
          name={"config.aPIToken"}
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
              name={"config.secret"}
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
              name={"config.secret"}
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
        <FormControlInput
          input={<SelectInput values={auditProfileOptions} />}
          name={"config.auditProfile"}
          id={"auditProfile"}
          label={"Audit Profile"}
        />
        <FormControlInput
          input={<TextInput />}
          name={"config.securityLevels"}
          id={"securityLevels"}
          label={"Security Levels"}
        />
        <FormControlInput
          input={<TextInput />}
          name={"config.roles"}
          id={"roles"}
          label={"Roles"}
        />
        <FormControlInput
          input={<TextInput />}
          name={"config.zones"}
          id={"zones"}
          label={"Zones"}
        />
      </Card>
    </div>
  );
};

export default TokenForm;
