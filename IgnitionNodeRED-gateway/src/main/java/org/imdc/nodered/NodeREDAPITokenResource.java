package org.imdc.nodered;

import com.inductiveautomation.ignition.gateway.dataroutes.openapi.annotations.Description;
import com.inductiveautomation.ignition.gateway.model.GatewayContext;
import com.inductiveautomation.ignition.gateway.secrets.Plaintext;
import com.inductiveautomation.ignition.gateway.secrets.Secret;
import com.inductiveautomation.ignition.gateway.secrets.SecretConfig;

import java.nio.charset.StandardCharsets;

public record NodeREDAPITokenResource(
        @Description("16 character alphanumeric API token") String APIToken,
        @Description("The secret (password) paired with the API token") SecretConfig Secret,
        @Description("The name of the audit profile that tag write actions will log to") String AuditProfile,
        @Description("A comma separated list of security levels to impersonate. If specified, security levels take precedence over roles and zones.") String SecurityLevels,
        @Description("A comma separated list of roles to impersonate") String Roles,
        @Description("A comma separated list of zones to impersonate") String Zones) {

    public String getSecret(GatewayContext context) throws Exception {
        SecretConfig secretConfig = this.Secret();
        if (secretConfig != null) {
            Secret<?> secret = com.inductiveautomation.ignition.gateway.secrets.Secret.create(context, secretConfig);
            Plaintext plaintext = secret.getPlaintext();
            String password;
            try {
                password = plaintext.getAsString(StandardCharsets.UTF_8);
            } finally {
                plaintext.clear();
            }
            return password;
        }

        throw new Exception("Secret configuration is empty");
    }
}
