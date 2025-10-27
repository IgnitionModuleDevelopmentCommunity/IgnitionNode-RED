import React, { useEffect, useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  BlankState,
  DataGrid,
  DataGridActionButtons,
  MenuItem,
  Button,
  ButtonColorClasses,
  PageHeader,
  Modal,
  ModalType,
  useToastNotifications,
} from "@inductiveautomation/ignition-web-ui";
import {
  AddSmall,
  EditGw,
  DeleteGw,
} from "@inductiveautomation/ignition-icons";
import { getNodeREDPageStyles } from "../_NodeRED.styles";
import { TokenResource, TokenUtils } from "./TokenForm.types";
import useFetch from "../../utils/useFetch";
import TokenEditDrawer from "./TokenEditDrawer";
import TokenAddModal from "./TokenAddModal";

const { TokenSchema, TokenDefaultValues } = TokenUtils;

const TokensPage = () => {
  const { notifySuccess, notifyError } = useToastNotifications();
  const {
    classes: { scBlankStateContainer, scTableContainer, scDeleteButton },
    theme,
  } = getNodeREDPageStyles();
  const [createTokenModal, setCreateTokenModal] = useState<boolean>(false);
  const [deleteTokenModal, setDeleteTokenModal] = useState<boolean>(false);
  const [editDrawer, setEditDrawer] = useState<boolean>(false);
  const [tokenResource, setTokenResource] = useState<TokenResource>();
  const [queryParams, setQueryParams] = useState<string>("?limit=20&offset=0");
  const [headers] = useState<any>({
    Accept: "application/json",
    "Content-Type": "application/json",
  });

  const csrfToken = useSelector(
    (state) => (state as any)?.userSession?.csrfToken
  );

  const {
    data,
    error,
    refresh: tableRefresh,
  } = useFetch(
    `/data/api/v1/resources/list/org.imdc.nodered.IgnitionNodeRED/token${queryParams}`,
    headers,
    (jsonObj) => {
      return {
        items: jsonObj.items.map((row) => ({
          name: row.name,
          enabled: row.enabled,
          description: row.description,
          signature: row.signature,
        })),
        metadata: {
          total: jsonObj.metadata.total,
          matching: jsonObj.metadata.matching,
          limit: jsonObj.metadata.limit,
          offset: jsonObj.metadata.offset,
        },
      };
    },
    {
      items: [],
      metadata: {
        total: 0,
        matching: 0,
        limit: 20,
        offset: 0,
      },
    },
    2000
  );

  useEffect(() => {
    if (error) {
      console.error(error);
    }
  }, [error]);

  const columnDefs = [
    {
      fieldName: "name",
      header: "Name",
    },
    {
      fieldName: "enabled",
      header: "Enabled",
      cell: ({ row }) => {
        return <>{row.originalValue.enabled ? "Yes" : "No"}</>;
      },
    },
  ];

  const context = useForm({
    mode: "onBlur",
    values: tokenResource as FieldValues,
    defaultValues: TokenDefaultValues,
    resolver: yupResolver(TokenSchema),
  });

  const secret = context.watch("config.Secret");
  const confirmSecret = context.watch("config.confirmSecret");
  const changeSecret = context.watch("config.changeSecret");

  const createToken = () => {
    context.reset({ ...TokenDefaultValues });
    setCreateTokenModal(true);
  };

  const actionButtons: DataGridActionButtons[] = [
    {
      inputType: "button",
      children: "Create Token",
      colorClass: ButtonColorClasses.PRIMARY,
      endIcon: <AddSmall />,
      onClick: () => {
        createToken();
      },
    },
  ];

  const handleEditClick = async (row) => {
    try {
      const response = await fetch(
        `/data/api/v1/resources/find/org.imdc.nodered.IgnitionNodeRED/token/${encodeURIComponent(
          row.name
        )}`,
        headers
      );

      if (response.ok) {
        const data: any = await response.json();
        setTokenResource({
          name: data.name,
          enabled: data.enabled,
          signature: data.signature,
          description: data.description,
          config: {
            APIToken: data.config.APIToken,
            storedSecret: data.config.Secret,
            AuditProfile: data.config.AuditProfile,
            SecurityLevels: data.config.SecurityLevels,
            Roles: data.config.Roles,
            Zones: data.config.Zones,
          },
        } as TokenResource);
        setEditDrawer(true);
      } else {
        notifyError("Failed to fetch token", true);
      }
    } catch (err) {
      notifyError("Failed to fetch token", true);
    }
  };

  const handleDeleteClick = async (row) => {
    try {
      const response = await fetch(
        `/data/api/v1/resources/find/org.imdc.nodered.IgnitionNodeRED/token/${encodeURIComponent(
          row.name
        )}`,
        headers
      );

      if (response.ok) {
        const data: TokenResource = await response.json();
        setTokenResource(data);
        setDeleteTokenModal(true);
      } else {
        notifyError("Failed to fetch token", true);
      }
    } catch (err) {
      notifyError("Failed to fetch token", true);
    }
  };

  const showMoreCallback = (row): MenuItem[] => {
    return [
      {
        onClick: (row) => handleEditClick(row),
        icon: () => (
          <EditGw
            width="1.5rem"
            height="1.5rem"
            data-icon="edit"
            color={theme.palette.primary.main}
          />
        ),
        text: "Edit",
      },
      {
        text: "Delete",
        icon: () => (
          <DeleteGw
            height={"1.5rem"}
            width={"1.5rem"}
            color={theme.palette.error.main}
          />
        ),
        onClick: (row) => handleDeleteClick(row),
        className: scDeleteButton,
      },
    ];
  };

  const closeEditToken = () => {
    setEditDrawer(false);
  };

  const addToken = async () => {
    try {
      const formValues = context.getValues();

      let encryptedSecret: { type: string; data: {} } | null;

      const encryptSecretResponse = await fetch(
        "/data/api/v1/encryption/encrypt",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: formValues.config.Secret,
        }
      );

      if (encryptSecretResponse.ok) {
        const encryptSecretData: any = await encryptSecretResponse.json();
        if (encryptSecretData) {
          encryptedSecret = {
            type: "Embedded",
            data: {
              ...encryptSecretData,
            },
          };
        } else {
          encryptedSecret = {
            type: "Embedded",
            data: {},
          };
        }

        const response = await fetch(
          "/data/api/v1/resources/org.imdc.nodered.IgnitionNodeRED/token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": csrfToken,
            },
            body: JSON.stringify([
              {
                name: formValues.name,
                enabled: formValues.enabled,
                description: formValues.description,
                config: {
                  APIToken: formValues.config.APIToken,
                  Secret: { ...encryptedSecret },
                  AuditProfile: formValues.config.AuditProfile,
                  SecurityLevels: formValues.config.SecurityLevels,
                  Roles: formValues.config.Roles,
                  Zones: formValues.config.Zones,
                },
              },
            ]),
          }
        );

        if (response.ok) {
          setCreateTokenModal(false);
          notifySuccess("Token created", true);
          tableRefresh();
          context.reset({ ...TokenDefaultValues });
        } else {
          notifyError("Failed to create token", true);
        }
      } else {
        notifyError("Failed to create token: encrypt secret", true);
      }
    } catch (e) {
      console.error(e);
      notifyError("Failed to create token. View logs for more details.", true);
    }
  };

  const editToken = async () => {
    try {
      if (tokenResource) {
        const formValues = context.getValues();

        let encryptedSecret: { type: string; data: {} } | null;
        encryptedSecret = null;

        if (formValues.config.Secret && formValues.config.Secret != "") {
          const encryptSecretResponse = await fetch(
            "/data/api/v1/encryption/encrypt",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken,
              },
              body: formValues.config.Secret,
            }
          );

          if (encryptSecretResponse.ok) {
            const encryptSecretData: any = await encryptSecretResponse.json();
            if (encryptSecretData) {
              encryptedSecret = {
                type: "Embedded",
                data: {
                  ...encryptSecretData,
                },
              };
            } else {
              encryptedSecret = {
                type: "Embedded",
                data: {},
              };
            }
          }
        }

        const response = await fetch(
          "/data/api/v1/resources/org.imdc.nodered.IgnitionNodeRED/token",
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": csrfToken,
            },
            body: JSON.stringify([
              {
                name: tokenResource.name,
                signature: tokenResource.signature,
                enabled: formValues.enabled,
                description: formValues.description,
                config: {
                  APIToken: formValues.config.APIToken,
                  Secret: encryptedSecret
                    ? { ...encryptedSecret }
                    : tokenResource.config.storedSecret,
                  AuditProfile: formValues.config.AuditProfile,
                  SecurityLevels: formValues.config.SecurityLevels,
                  Roles: formValues.config.Roles,
                  Zones: formValues.config.Zones,
                },
              },
            ]),
          }
        );

        if (response.ok) {
          closeEditToken();
          notifySuccess("Changes saved", true);
          tableRefresh();
          setTokenResource(undefined);
          context.reset({ ...TokenDefaultValues });
        } else {
          notifyError("Failed to update token", true);
        }
      }
    } catch (e) {
      console.error(e);
      notifyError("Failed to update token. View logs for more details.", true);
    }
  };

  const deleteToken = async () => {
    try {
      if (tokenResource) {
        const response = await fetch(
          `/data/api/v1/resources/org.imdc.nodered.IgnitionNodeRED/token/${encodeURIComponent(
            tokenResource.name
          )}/${encodeURIComponent(tokenResource.signature)}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": csrfToken,
            },
          }
        );

        if (response.ok) {
          setDeleteTokenModal(false);
          notifySuccess("Token deleted", true);
          tableRefresh();
          setTokenResource(undefined);
          context.reset({ ...TokenDefaultValues });
        } else {
          notifyError("Failed to delete token", true);
        }
      }
    } catch (e) {
      console.error(e);
      notifyError("Failed to delete token. View logs for more details.", true);
    }
  };

  const createModal = (
    <Modal
      open={createTokenModal}
      onClose={() => setCreateTokenModal(false)}
      onConfirm={addToken}
      hideHeader={true}
      title={"Create Token"}
      modalConfig={{
        content: (
          <TokenAddModal
            close={() => setCreateTokenModal(false)}
            create={addToken}
            context={context}
            isDisabled={secret !== confirmSecret}
          />
        ),
      }}
      type={ModalType.CUSTOM}
    />
  );

  const blankStateContent = "Connect NodeRED to Ignition.";
  const blankStatePrimaryButton = (
    <>
      <Button
        dataLabel="Create Token"
        colorClass={ButtonColorClasses.PRIMARY}
        endIcon={<AddSmall data-icon="create" />}
        onClick={() => createToken()}
      >
        Create Token
      </Button>
      {createModal}
    </>
  );
  const blankStateComponent = (
    <BlankState
      content={blankStateContent}
      label="No Tokens"
      primaryButton={blankStatePrimaryButton}
      icon={<img src="/res/sys/icons/services.png" alt="" />}
    />
  );
  const blankState = (
    <div className={scBlankStateContainer}>{blankStateComponent}</div>
  );

  const TokensContent = (
    <div className={scTableContainer}>
      <div className="scTableContainer">
        <DataGrid
          columnDefs={columnDefs}
          itemName="Token"
          data={data.items}
          id="tokens-data-grid"
          paginationParams={{
            total: data.metadata.total,
            matching: data.metadata.matching,
            limit: data.metadata.limit,
            offset: data.metadata.offset,
          }}
          setTableQueryParams={setQueryParams}
          actionButtons={actionButtons}
          showMore={showMoreCallback}
        />
        <TokenEditDrawer
          open={editDrawer}
          onClose={closeEditToken}
          tokenName={tokenResource?.name}
          context={context}
          onComplete={editToken}
          isDisabled={changeSecret && secret !== confirmSecret}
        />
        <Modal
          open={deleteTokenModal}
          title={"Delete Token?"}
          hideHeader={false}
          modalConfig={{
            primaryText: "Delete",
            secondaryText: "Cancel",
            confirmationText: `Are you sure you want to delete token ${tokenResource?.name}?`,
          }}
          type={ModalType.CONFIRM}
          onClose={() => setDeleteTokenModal(false)}
          onConfirm={deleteToken}
        />
        {createModal}
      </div>
    </div>
  );

  return (
    <>
      <PageHeader pageTitle="Tokens" />
      {data.metadata.total === 0 ? blankState : TokensContent}
    </>
  );
};

export default TokensPage;
