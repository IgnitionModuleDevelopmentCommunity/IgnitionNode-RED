package org.imdc.nodered.servlet;

import com.inductiveautomation.ignition.common.resourcecollection.Resource;
import com.inductiveautomation.ignition.gateway.config.DecodedResource;
import com.inductiveautomation.ignition.gateway.config.ResourceCodec;
import com.inductiveautomation.ignition.gateway.model.GatewayContext;
import org.imdc.nodered.GatewayHook;
import org.imdc.nodered.NodeREDAPITokenResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

public class APITokenValidation {
    private boolean success;
    private String errorMessage, tokenName, token, auditProfileName, securityLevels, roles, zones;

    public APITokenValidation(boolean success, String errorMessage, String tokenName, String token, String auditProfileName, String securityLevels, String roles, String zones) {
        this.success = success;
        this.errorMessage = errorMessage;
        this.tokenName = tokenName;
        this.token = token;
        this.auditProfileName = auditProfileName;
        this.securityLevels = securityLevels;
        this.roles = roles;
        this.zones = zones;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public String getTokenName() {
        return tokenName;
    }

    public String getToken() {
        return token;
    }

    public String getAuditProfileName() {
        return auditProfileName;
    }

    public boolean isAuditProfileDefined() {
        return auditProfileName != null;
    }

    public String getSecurityLevels() {
        return securityLevels;
    }

    public String getRoles() {
        return roles;
    }

    public String getZones() {
        return zones;
    }

    public static APITokenValidation validateToken(GatewayContext context, String apiToken, String secret) {
        Logger logger = LoggerFactory.getLogger(APITokenValidation.class);

        boolean success = true;
        String errorMessage = null;

        try {
            List<Resource> tokenResources = context.getConfigurationManager().getResources(GatewayHook.TOKEN_RESOURCE_TYPE);
            boolean found = false;
            for (Resource resource : tokenResources) {
                ResourceCodec<NodeREDAPITokenResource> codec = GatewayHook.TOKEN_RESOURCE_TYPE_META.getCodec();
                DecodedResource<NodeREDAPITokenResource> decodedResource = codec.decode(resource);
                NodeREDAPITokenResource token = decodedResource.config();
                if (token.APIToken().equals(apiToken)) {
                    if (decodedResource.enabled()) {
                        if (!token.getSecret(context).equals(secret)) {
                            success = false;
                            errorMessage = "Invalid API token and secret";
                        } else {
                            return new APITokenValidation(success, errorMessage, decodedResource.name(), token.APIToken(), token.AuditProfile(), token.SecurityLevels(), token.Roles(), token.Zones());
                        }
                    } else {
                        success = false;
                        errorMessage = "API token and secret is disabled";
                    }
                    found = true;
                    break;
                }
            }

            if (!found) {
                success = false;
                errorMessage = "Invalid API token";
            }
        } catch (Throwable t) {
            success = false;
            errorMessage = "Invalid API token";
            logger.error("Error getting API token", t);
        }

        return new APITokenValidation(success, errorMessage, null, null, null, null, null, null);
    }
}
