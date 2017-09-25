package org.imdc.nodered.servlet;

import com.inductiveautomation.ignition.common.model.values.QualifiedValue;
import com.inductiveautomation.ignition.common.model.values.Quality;
import com.inductiveautomation.ignition.common.sqltags.model.TagPath;
import com.inductiveautomation.ignition.common.sqltags.model.types.DataQuality;
import com.inductiveautomation.ignition.common.sqltags.parser.TagPathParser;
import com.inductiveautomation.ignition.gateway.model.GatewayContext;
import com.inductiveautomation.ignition.gateway.sqltags.model.WriteRequest;
import org.imdc.nodered.NodeREDAPITokens;
import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import simpleorm.dataset.SQuery;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.List;

/**
 * Created by travis.cox on 8/31/2017.
 */
public class NodeREDServlet extends HttpServlet {

    public static final String PATH = "node-red";
    private static final SimpleDateFormat DF = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

    private final Logger logger = LoggerFactory.getLogger(getClass());

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.sendError(501, "Not Implemented");
    }

    @Override
    protected void doHead(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.sendError(501, "Not Implemented");
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.sendError(501, "Not Implemented");
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.sendError(501, "Not Implemented");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.sendError(501, "Not Implemented");
    }

    @Override
    protected void doTrace(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.sendError(501, "Not Implemented");
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        GatewayContext context = getContext();
        String contentType = req.getContentType();
        JSONObject input = null;
        JSONObject ret = new JSONObject();

        if ("application/json".equals(contentType)) {
            String jsonString = readAll(req);
            try {
                input = new JSONObject(jsonString);
            } catch (JSONException ex) {
                logger.warn("Unable to parse POST data as JSON:\n" + jsonString, ex);
            }
        }

        if (input == null) {
            resp.sendError(500, "POST data empty");
            return;
        } else {
            JSONObject result = new JSONObject();
            String errorMessage = null;
            Integer statusCode = 1;

            try {
                String apiToken = input.getString("apiToken");
                String secret = input.getString("secret");
                APITokenValidation validation = validateToken(context, apiToken, secret);

                if (validation.isSuccess()) {
                    String command = input.getString("command");
                    if (command.equals("tagRead") || command.equals("tagWrite")) {
                        String defaultTagProvider = "default";

                        try {
                            defaultTagProvider = input.getString("defaultTagProvider");
                        } catch (JSONException ignored) {
                        }

                        if (defaultTagProvider == null || defaultTagProvider.equals("")) {
                            defaultTagProvider = "default";
                        }

                        String tagPathStr = input.getString("tagPath");
                        TagPath tagPath = TagPathParser.parseSafe(defaultTagProvider, tagPathStr);
                        if (tagPath == null) {
                            errorMessage = "Tag path '" + tagPathStr + "' is invalid";
                        } else {
                            result.put("defaultTagProvider", defaultTagProvider);
                            result.put("inTagPath", tagPathStr);
                            result.put("tagPath", tagPath.toStringFull());

                            if (command.equals("tagRead")) {
                                tagRead(context, tagPath, result);
                            } else if (command.equals("tagWrite")) {
                                Object writeValue = input.get("value");
                                tagWrite(context, tagPath, writeValue, result);
                            }
                        }
                    } else {
                        errorMessage = "Command '" + command + "' is invalid";
                    }
                } else {
                    errorMessage = validation.getErrorMessage();
                }
            } catch (JSONException ex) {
                logger.warn("Incorrect format for JSON POST data: " + input.toString(), ex);
                errorMessage = "Incorrect format for JSON POST data: " + input.toString();
            }

            try {
                ret.put("ignitionResult", result);

                if (errorMessage != null) {
                    statusCode = 0;
                    logger.warn(errorMessage);
                    ret.put("errorMessage", errorMessage);
                }

                ret.put("statusCode", statusCode);
            } catch (Exception ignored) {
            }
        }

        try {
            resp.setContentType("application/json");
            ret.write(resp.getWriter());
        } catch (Exception ex) {
            logger.warn("Error writing JSON response:\n" + ret.toString(), ex);
            resp.sendError(500, ex.getMessage());
        }
    }

    private APITokenValidation validateToken(GatewayContext context, String apiToken, String secret) {
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

    private void tagRead(GatewayContext context, final TagPath tagPath, JSONObject result) throws JSONException {
        List<QualifiedValue> tagValues = context.getTagManager().read(Arrays.asList(tagPath));
        QualifiedValue tagValue = tagValues.get(0);

        result.put("value", tagValue.getValue());

        setQuality(result, tagValue.getQuality());
        result.put("timestamp", DF.format(tagValue.getTimestamp()));
    }

    private void tagWrite(GatewayContext context, final TagPath tagPath, final Object writeValue, JSONObject result) throws JSONException {
        result.put("inTagValue", writeValue);

        List<Quality> writeResult = context.getTagManager().write(Arrays.asList(new WriteRequest<TagPath>() {
            @Override
            public TagPath getTarget() {
                return tagPath;
            }

            @Override
            public Object getValue() {
                return writeValue;
            }
        }), null, true);

        Quality writeQuality = writeResult.get(0);
        setQuality(result, writeQuality);
    }

    private void setQuality(JSONObject result, Quality qual) throws JSONException {
        JSONObject quality = new JSONObject();
        quality.put("name", qual.getName());
        quality.put("isGood", qual.isGood());
        if (qual instanceof DataQuality) {
            quality.put("intValue", ((DataQuality) qual).getIntValue());
        }

        result.put("quality", quality);
    }

    private String readAll(HttpServletRequest req) throws IOException {
        StringBuilder sb = new StringBuilder();
        String line;
        BufferedReader reader = req.getReader();
        while ((line = reader.readLine()) != null) {
            sb.append(line).append('\n');
        }
        return sb.toString();
    }

    private GatewayContext getContext() {
        GatewayContext context = (GatewayContext) getServletContext().getAttribute(GatewayContext.SERVLET_CONTEXT_KEY);
        return context;
    }

    private class APITokenValidation {
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
    }
}
