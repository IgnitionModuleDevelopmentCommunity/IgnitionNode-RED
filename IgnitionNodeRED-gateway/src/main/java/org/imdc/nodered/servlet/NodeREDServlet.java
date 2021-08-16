package org.imdc.nodered.servlet;

import com.inductiveautomation.ignition.common.browsing.BrowseFilter;
import com.inductiveautomation.ignition.common.browsing.Results;
import com.inductiveautomation.ignition.common.model.values.QualifiedValue;
import com.inductiveautomation.ignition.common.model.values.QualityCode;
import com.inductiveautomation.ignition.common.tags.browsing.NodeDescription;
import com.inductiveautomation.ignition.common.tags.model.TagPath;
import com.inductiveautomation.ignition.common.tags.paths.parser.TagPathParser;
import com.inductiveautomation.ignition.gateway.model.GatewayContext;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;
import java.util.concurrent.ExecutionException;

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
            String jsonString = reqToJSON(req);
            try {
                input = new JSONObject(jsonString);
            } catch (JSONException ex) {
                logger.warn("Unable to parse POST data as JSON: " + ex.getMessage(), ex);
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
                APITokenValidation validation = APITokenValidation.validateToken(context, apiToken, secret);

                if (validation.isSuccess()) {
                    String command = input.getString("command");
                    if (command.equals("tagRead") || command.equals("tagWrite") || command.equals("tagBrowse")) {
                        String defaultTagProvider = "default";

                        try {
                            defaultTagProvider = input.getString("defaultTagProvider");
                        } catch (JSONException ignored) {
                        }

                        if (defaultTagProvider == null || defaultTagProvider.equals("")) {
                            defaultTagProvider = "default";
                        }

                        List<TagPath> tagPaths = new ArrayList<>();

                        if (input.has("tagPath")) {
                            String tagPathStr = input.getString("tagPath");
                            TagPath tagPath = TagPathParser.parseSafe(defaultTagProvider, tagPathStr);
                            if (tagPath == null) {
                                errorMessage = "Tag path '" + tagPathStr + "' is invalid";
                            }
                            tagPaths.add(tagPath);
                        } else {
                            JSONArray tagPathsArray = input.getJSONArray("tagPaths");
                            for (int i = 0; i < tagPathsArray.length(); i++) {
                                String tagPathStr = tagPathsArray.getString(i);
                                TagPath tagPath = TagPathParser.parseSafe(defaultTagProvider, tagPathStr);
                                if (tagPath == null) {
                                    errorMessage = "Tag path '" + tagPathStr + "' is invalid";
                                }
                                tagPaths.add(tagPath);
                            }
                        }

                        if (tagPaths.size() == 0) {
                            errorMessage = "No tags supplied";
                        }

                        if (errorMessage == null) {
                            if (command.equals("tagRead")) {
                                tagRead(context, tagPaths, result);
                            } else if (command.equals("tagBrowse")) {
                                tagBrowse(context, tagPaths, result);
                            } else if (command.equals("tagWrite")) {
                                List<Object> values = new ArrayList<>();
                                if (input.has("value")) {
                                    values.add(input.get("value"));
                                } else {
                                    JSONArray valuesArray = input.getJSONArray("values");
                                    for (int i = 0; i < valuesArray.length(); i++) {
                                        Object value = valuesArray.get(i);
                                        values.add(value);
                                    }
                                }

                                if (values.size() == 1 && tagPaths.size() > 1) {
                                    for (int i = 0; i < (tagPaths.size() - 1); i++) {
                                        values.add(values.get(0));
                                    }
                                }

                                if (values.size() != tagPaths.size()) {
                                    errorMessage = "Number of tag paths (" + tagPaths.size() + ") does not match values (" + values.size() + ")";
                                } else {
                                    tagWrite(context, tagPaths, values, result);
                                }
                            }
                        }
                    } else {
                        errorMessage = "Command '" + command + "' is invalid";
                    }
                } else {
                    errorMessage = validation.getErrorMessage();
                }
            } catch (JSONException ex) {
                logger.warn("Incorrect format for JSON POST data", ex);
                errorMessage = "Incorrect format for JSON POST data: " + ex.getMessage();
            } catch (ExecutionException | InterruptedException ex) {
                logger.warn("Error executing command", ex);
                errorMessage = "Error executing command: " + ex.getMessage();
            }

            try {
                ret.put("ignitionResult", result);

                if (errorMessage != null) {
                    statusCode = 0;
                    logger.warn(errorMessage);
                } else {
                    errorMessage = "";
                }

                ret.put("errorMessage", errorMessage);
                ret.put("statusCode", statusCode);
            } catch (Exception ignored) {
            }
        }

        try {
            resp.setContentType("application/json");
            ret.write(resp.getWriter());
        } catch (Exception ex) {
            logger.warn("Error writing JSON response", ex);
            resp.sendError(500, ex.getMessage());
        }
    }

    public static void setTagValue(List<TagPath> tagPaths, List<QualifiedValue> tagValues, JSONObject result) throws JSONException {
        if (tagPaths.size() == 1) {
            result.put("tagPath", tagPaths.get(0).toStringFull());
            result.put("value", tagValues.get(0).getValue());
            setQuality(result, tagValues.get(0).getQuality());
            result.put("timestamp", DF.format(tagValues.get(0).getTimestamp()));
        } else {
            JSONArray resultValues = new JSONArray();
            for (int i = 0; i < tagPaths.size(); i++) {
                TagPath tagPath = tagPaths.get(i);
                QualifiedValue tagValue = tagValues.get(i);
                JSONObject tagObject = new JSONObject();
                tagObject.put("tagPath", tagPath.toStringFull());
                tagObject.put("value", tagValue.getValue());
                setQuality(tagObject, tagValue.getQuality());
                tagObject.put("timestamp", DF.format(tagValue.getTimestamp()));
                resultValues.put(tagObject);
            }
            result.put("values", resultValues);
        }
    }

    public static void setQuality(JSONObject result, QualityCode qual) throws JSONException {
        JSONObject quality = new JSONObject();
        quality.put("name", qual.getName());
        quality.put("isGood", qual.isGood());
        quality.put("intValue", qual.getCode());
        result.put("quality", quality);
    }

    private JSONArray browseTags(GatewayContext context, TagPath tagPath) throws JSONException, ExecutionException, InterruptedException {
        JSONArray tagsArray = new JSONArray();
        Results<NodeDescription> browseResults = context.getTagManager().browseAsync(tagPath, BrowseFilter.NONE).get();
        Collection<NodeDescription> tagDescriptions = browseResults.getResults();
        Iterator<NodeDescription> iterator = tagDescriptions.iterator();
        while (iterator.hasNext()) {
            NodeDescription tagDesc = iterator.next();
            JSONObject tagObject = new JSONObject();
            tagObject.put("tagPath", tagPath.toStringFull() + "/" + tagDesc.getName());
            tagObject.put("name", tagDesc.getName());
            tagObject.put("tagType", tagDesc.getObjectType().toString());
            tagObject.put("dataType", tagDesc.getDataType().name());
            tagObject.put("value", tagDesc.getCurrentValue().getValue());
            setQuality(tagObject, tagDesc.getCurrentValue().getQuality());
            tagObject.put("timestamp", DF.format(tagDesc.getCurrentValue().getTimestamp()));
            tagsArray.put(tagObject);
        }

        return tagsArray;
    }

    private void tagBrowse(GatewayContext context, final List<TagPath> tagPaths, JSONObject result) throws JSONException, ExecutionException, InterruptedException {
        if (tagPaths.size() == 1) {
            result.put("tagPath", tagPaths.get(0).toStringFull());
            result.put("tags", browseTags(context, tagPaths.get(0)));
        } else {
            JSONArray resultValues = new JSONArray();
            for (int i = 0; i < tagPaths.size(); i++) {
                JSONObject tagObject = new JSONObject();
                TagPath tagPath = tagPaths.get(i);
                tagObject.put("tagPath", tagPath.toStringFull());
                tagObject.put("tags", browseTags(context, tagPath));
                resultValues.put(tagObject);
            }
            result.put("values", resultValues);
        }
    }

    private void tagRead(GatewayContext context, final List<TagPath> tagPaths, JSONObject result) throws JSONException, ExecutionException, InterruptedException {
        List<QualifiedValue> tagValues = context.getTagManager().readAsync(tagPaths).get();
        setTagValue(tagPaths, tagValues, result);
    }

    private void tagWrite(GatewayContext context, final List<TagPath> tagPaths, final List<Object> writeValues, JSONObject result) throws JSONException, ExecutionException, InterruptedException {
        List<QualityCode> writeResult = context.getTagManager().writeAsync(tagPaths, writeValues).get();
        if (tagPaths.size() == 1) {
            TagPath tagPath = tagPaths.get(0);
            QualityCode quality = writeResult.get(0);
            result.put("tagPath", tagPath.toStringFull());
            result.put("value", writeValues.get(0));
            setQuality(result, quality);
        } else {
            JSONArray resultValues = new JSONArray();
            for (int i = 0; i < tagPaths.size(); i++) {
                JSONObject tagObject = new JSONObject();
                TagPath tagPath = tagPaths.get(i);
                QualityCode quality = writeResult.get(i);
                tagObject.put("tagPath", tagPath.toStringFull());
                tagObject.put("value", writeValues.get(i));
                setQuality(tagObject, quality);
                resultValues.put(tagObject);
            }
            result.put("values", resultValues);
        }
    }

    private String reqToJSON(HttpServletRequest req) throws IOException {
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
}
