package org.imdc.nodered.servlet;

import com.inductiveautomation.ignition.gateway.audit.AuditProfileRecord;
import com.inductiveautomation.ignition.gateway.model.GatewayContext;
import org.imdc.nodered.NodeREDAPITokens;
import simpleorm.dataset.SQuery;

public class APITokenValidation {
    private boolean success;
    private String errorMessage, tokenName, token, auditProfileName;

    public APITokenValidation(boolean success, String errorMessage, String tokenName, String token, String auditProfileName) {
        this.success = success;
        this.errorMessage = errorMessage;
        this.tokenName = tokenName;
        this.token = token;
        this.auditProfileName = auditProfileName;
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
            if (!r.isEnabled()) {
                success = false;
                errorMessage = "API token and secret is disabled";
            } else if (!r.getSecret().equals(secret)) {
                success = false;
                errorMessage = "Invalid API token and secret";
            }
        }

        String auditProfileName = null;
        if (r.getAuditProfileId() != null) {
            SQuery<AuditProfileRecord> auditQuery = new SQuery<>(AuditProfileRecord.META);
            auditQuery.eq(AuditProfileRecord.Id, r.getAuditProfileId());
            AuditProfileRecord auditRecord = context.getPersistenceInterface().queryOne(auditQuery);
            if (auditRecord != null) {
                auditProfileName = auditRecord.getName();
            }
        }

        return new APITokenValidation(success, errorMessage, r.getName(), r.getAPIToken(), auditProfileName);
    }
}
