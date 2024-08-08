package org.imdc.nodered;

import com.inductiveautomation.ignition.gateway.audit.AuditProfileRecord;
import com.inductiveautomation.ignition.gateway.localdb.persistence.*;
import com.inductiveautomation.ignition.gateway.web.components.editors.PasswordEditorSource;
import org.apache.commons.lang3.StringUtils;
import simpleorm.dataset.SFieldFlags;
import simpleorm.dataset.SFieldMeta;
import simpleorm.dataset.SRecordInstance;
import simpleorm.dataset.validation.SValidatorI;
import simpleorm.utils.SException;

public class NodeREDAPITokens extends PersistentRecord {
    public static final RecordMeta<NodeREDAPITokens> META = new RecordMeta<>(
            NodeREDAPITokens.class,
            "NodeREDAPITokens"
    ).setNounKey("NodeRED.Noun")
            .setNounPluralKey("NodeRED.Noun.Plural");

    public static final IdentityField Id = new IdentityField(META, "Id");
    public static final StringField Name = new StringField(META, "Name", SFieldFlags.SMANDATORY, SFieldFlags.SDESCRIPTIVE);
    public static final StringField APIToken = new StringField(META, "APIToken", SFieldFlags.SMANDATORY).addValidator(new SValidatorI() {
        @Override
        public void onValidate(SFieldMeta field, SRecordInstance instance) throws SException.Validation {
            if (!instance.isNull(field)) {
                String val = instance.getString(field);

                if (val.length() != 16) {
                    throw new SException.Validation("Field " + field + " value must be 16 characters");
                }

                if (!StringUtils.isAlphanumeric(val)) {
                    throw new SException.Validation("Field " + field + " value must be alphanumeric");
                }
            } else {
                throw new SException.Validation("Field " + field + " cannot be NULL");
            }
        }
    });
    public static final EncodedStringField Secret = new EncodedStringField(META, "Secret", SFieldFlags.SMANDATORY);

    public static final LongField AuditProfileId = new LongField(META, "AuditProfileId");
    public static final ReferenceField<AuditProfileRecord> AuditProfile =
            new ReferenceField<AuditProfileRecord>(META, AuditProfileRecord.META, "AuditProfile", AuditProfileId);

    public static final StringField SecurityLevels = new StringField(META, "SecurityLevels").addValidator(new SValidatorI() {
        @Override
        public void onValidate(SFieldMeta field, SRecordInstance instance) throws SException.Validation {
            if (!instance.isNull(field)) {
                String val = instance.getString(field);

                try {
                    val.split(",");
                } catch (Throwable ex) {
                    throw new SException.Validation("Field " + field + " value must be a comma separated string");
                }
            }
        }
    });
    public static final StringField Roles = new StringField(META, "Roles").addValidator(new SValidatorI() {
        @Override
        public void onValidate(SFieldMeta field, SRecordInstance instance) throws SException.Validation {
            if (!instance.isNull(field)) {
                String val = instance.getString(field);

                try {
                    val.split(",");
                } catch (Throwable ex) {
                    throw new SException.Validation("Field " + field + " value must be a comma separated string");
                }
            }
        }
    });
    public static final StringField Zones = new StringField(META, "Zones").addValidator(new SValidatorI() {
        @Override
        public void onValidate(SFieldMeta field, SRecordInstance instance) throws SException.Validation {
            if (!instance.isNull(field)) {
                String val = instance.getString(field);

                try {
                    val.split(",");
                } catch (Throwable ex) {
                    throw new SException.Validation("Field " + field + " value must be a comma separated string");
                }
            }
        }
    });

    public static final BooleanField Enabled = new BooleanField(META, "Enabled").setDefault(true);

    public static final Category SettingsCategory = new Category("NodeRED.Settings", 125).include(Name, APIToken, Secret, AuditProfile, Enabled);

    public static final Category ImpersonateCategory = new Category("NodeRED.Impersonate", 126).include(SecurityLevels, Roles, Zones);

    static {
        Name.getFormMeta().setFieldNameKey("NodeRED.Name.Name");
        Name.getFormMeta().setFieldDescriptionKey("NodeRED.Name.Desc");
        APIToken.getFormMeta().setFieldNameKey("NodeRED.APIToken.Name");
        APIToken.getFormMeta().setFieldDescriptionKey("NodeRED.APIToken.Desc");
        Secret.getFormMeta().setFieldNameKey("NodeRED.Secret.Name");
        Secret.getFormMeta().setFieldDescriptionKey("NodeRED.Secret.Desc");
        Secret.getFormMeta().setEditorSource(PasswordEditorSource.getSharedInstance());
        AuditProfile.getFormMeta().setFieldNameKey("NodeRED.AuditProfile.Name");
        AuditProfile.getFormMeta().setFieldDescriptionKey("NodeRED.AuditProfile.Desc");
        SecurityLevels.getFormMeta().setFieldNameKey("NodeRED.SecurityLevels.Name");
        SecurityLevels.getFormMeta().setFieldDescriptionKey("NodeRED.SecurityLevels.Desc");
        Roles.getFormMeta().setFieldNameKey("NodeRED.Roles.Name");
        Roles.getFormMeta().setFieldDescriptionKey("NodeRED.Roles.Desc");
        Zones.getFormMeta().setFieldNameKey("NodeRED.Zones.Name");
        Zones.getFormMeta().setFieldDescriptionKey("NodeRED.Zones.Desc");
        Enabled.getFormMeta().setFieldNameKey("NodeRED.Enabled.Name");
        Enabled.getFormMeta().setFieldDescriptionKey("NodeRED.Enabled.Desc");
    }

    @Override
    public RecordMeta<?> getMeta() {
        return META;
    }

    public Long getId() {
        return getLong(Id);
    }

    public Boolean isEnabled() {
        return getBoolean(Enabled);
    }

    public String getName() {
        return getString(Name);
    }

    public String getAPIToken() {
        return getString(APIToken);
    }

    public String getSecret() {
        return getString(NodeREDAPITokens.Secret);
    }

    public Long getAuditProfileId() {
        return getLong(AuditProfileId);
    }

    public String getSecurityLevels() {
        return getString(SecurityLevels);
    }

    public String getRoles() {
        return getString(Roles);
    }

    public String getZones() {
        return getString(Zones);
    }
}
