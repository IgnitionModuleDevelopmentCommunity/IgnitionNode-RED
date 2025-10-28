package org.imdc.nodered;

import com.inductiveautomation.ignition.gateway.dataroutes.openapi.annotations.Description;
import com.inductiveautomation.ignition.gateway.model.GatewayContext;
import com.inductiveautomation.ignition.gateway.secrets.Plaintext;
import com.inductiveautomation.ignition.gateway.secrets.Secret;
import com.inductiveautomation.ignition.gateway.secrets.SecretConfig;

import java.nio.charset.StandardCharsets;

public record NodeREDAPITokenResource(
        @Description("16 character alphanumeric API token") String aPIToken,
        @Description("The secret (password) paired with the API token") SecretConfig secret,
        @Description("The name of the audit profile that tag write actions will log to") String auditProfile,
        @Description("A comma separated list of security levels to impersonate. If specified, security levels take precedence over roles and zones.") String securityLevels,
        @Description("A comma separated list of roles to impersonate") String roles,
        @Description("A comma separated list of zones to impersonate") String zones) {

    public String getSecret(GatewayContext context) throws Exception {
        SecretConfig secretConfig = this.secret();
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
