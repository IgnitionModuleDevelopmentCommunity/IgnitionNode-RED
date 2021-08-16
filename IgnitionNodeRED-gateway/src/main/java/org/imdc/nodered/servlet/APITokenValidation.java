package org.imdc.nodered.servlet;

import com.inductiveautomation.ignition.gateway.model.GatewayContext;
import org.imdc.nodered.NodeREDAPITokens;
import simpleorm.dataset.SQuery;

public class APITokenValidation {
    private boolean success;
    private String errorMessage;

    public APITokenValidation(boolean success, String errorMessage) {
        this.success = success;
        this.errorMessage = errorMessage;
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

    public static APITokenValidation validateToken(GatewayContext context, String apiToken, String secret) {
        boolean success = true;
        String errorMessage = null;

        SQuery<NodeREDAPITokens> query = new SQuery<>(NodeREDAPITokens.META);
        query.eq(NodeREDAPITokens.APIToken, apiToken);
        NodeREDAPITokens r = context.getPersistenceInterface().queryOne(query);
        if (r == null) {
            success = false;
            errorMessage = "Invalid API token and secret";
        } else {
            if (!r.getBoolean(NodeREDAPITokens.Enabled)) {
                success = false;
                errorMessage = "API token and secret is disabled";
            } else if (!r.getString(NodeREDAPITokens.Secret).equals(secret)) {
                success = false;
                errorMessage = "Invalid API token and secret";
            }
        }

        return new APITokenValidation(success, errorMessage);
    }
}
