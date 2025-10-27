package org.imdc.nodered.servlet;

import com.inductiveautomation.ignition.common.tags.model.TagPath;
import com.inductiveautomation.ignition.common.tags.model.event.InvalidListenerException;
import com.inductiveautomation.ignition.common.tags.model.event.TagChangeEvent;
import com.inductiveautomation.ignition.common.tags.model.event.TagChangeListener;
import com.inductiveautomation.ignition.common.tags.paths.parser.TagPathParser;
import com.inductiveautomation.ignition.gateway.model.GatewayContext;
import jakarta.servlet.http.HttpServletResponse;
import org.eclipse.jetty.ee10.websocket.server.*;
import org.eclipse.jetty.websocket.api.Callback;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.annotations.*;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

public class NodeREDWebSocketServlet extends JettyWebSocketServlet {
    public static final String PATH = "node-red-ws";
    private static final int KB = 1024;
    private static final int MB = 1024 * KB;

    @Override
    public void configure(JettyWebSocketServletFactory factory) {
        factory.setMaxTextMessageSize(2 * MB);
        factory.setCreator(new NodeREDWebSocketCreator(getContext()));
    }

    private GatewayContext getContext() {
        GatewayContext context = (GatewayContext) getServletContext().getAttribute(GatewayContext.SERVLET_CONTEXT_KEY);
        return context;
    }

    private static class NodeREDWebSocketCreator implements JettyWebSocketCreator {
        private final Logger logger = LoggerFactory.getLogger(getClass());
        private GatewayContext context;

        public NodeREDWebSocketCreator(GatewayContext context) {
            this.context = context;
        }

        private NodeREDWebSocketChannel error(JettyServerUpgradeResponse resp,
                                              Logger logger,
                                              int errorCode,
                                              String errorMessage,
                                              String logMessage,
                                              Object... logMessageArgs) {
            try {
                resp.sendError(errorCode, errorMessage);
            } catch (IOException e) {
                logger.error(String.format(logMessage, logMessageArgs), e);
            }
            return null;
        }

        @Override
        public Object createWebSocket(JettyServerUpgradeRequest req, JettyServerUpgradeResponse resp) {
            String requestPath = req.getRequestPath();
            if (!requestPath.startsWith("/system/" + PATH)) {
                return error(resp, logger, HttpServletResponse.SC_NOT_FOUND, "Not Found", "Unable to send not-found response");
            }

            return new NodeREDWebSocketChannel(context);
        }
    }

    @WebSocket
    public static class NodeREDWebSocketChannel implements TagChangeListener, Runnable {
        private final Logger logger = LoggerFactory.getLogger(getClass());
        private GatewayContext context;
        private Session session;
        private String defaultTagProvider;
        private List<TagPath> tagPaths;
        private ScheduledFuture pingFuture;

        public NodeREDWebSocketChannel(GatewayContext context) {
            this.context = context;
            this.tagPaths = new ArrayList<>();
        }

        private List<TagChangeListener> getListeners() {
            List<TagChangeListener> tagChangeListeners = new ArrayList<>();
            for (TagPath tagPath : tagPaths) {
                tagChangeListeners.add(this);
            }
            return tagChangeListeners;
        }

        private void subscribe() throws IOException {
            if (tagPaths.size() > 0) {
                logger.trace("Subscribing to: " + tagPaths.stream().map(tagPath -> tagPath.toStringFull()).collect(Collectors.joining(", ", "[", "]")));
                context.getTagManager().subscribeAsync(tagPaths, getListeners());
            }
        }

        private void unsubscribe() throws IOException {
            if (tagPaths.size() > 0) {
                logger.trace("Unsubscribing to: " + tagPaths.stream().map(tagPath -> tagPath.toStringFull()).collect(Collectors.joining(", ", "[", "]")));
                context.getTagManager().unsubscribeAsync(tagPaths, getListeners());
            }
        }

        private void sendError(String errorMessage) {
            try {
                JSONObject ret = new JSONObject();
                ret.put("statusCode", 0);
                ret.put("errorMessage", errorMessage);
                session.sendText(ret.toString(), new Callback.Completable());
            } catch (Throwable t) {
                logger.warn("Unable to send result", t);
            }
        }

        @OnWebSocketClose
        public void onClose(int statusCode, String reason) {
            try {
                logger.warn("Close: " + reason);
                unsubscribe();
                this.pingFuture.cancel(true);
            } catch (Throwable e) {
                logger.error("Error onClose", e);
            }
        }

        @OnWebSocketError
        public void onError(Throwable t) {
            try {
                logger.warn("Web socket error", t);
                unsubscribe();
                this.pingFuture.cancel(true);
            } catch (Throwable e) {
                logger.error("Error onError", e);
            }
        }

        @OnWebSocketOpen
        public void onOpen(Session session) {
            try {
                if (logger.isTraceEnabled()) {
                    logger.trace(String.format(
                        "Connect: %s",
                        ((InetSocketAddress) session.getRemoteSocketAddress()).getAddress()
                    ));
                }
                this.session = session;
                this.pingFuture = context.getExecutionManager().scheduleWithFixedDelay(this, 10, 10, TimeUnit.SECONDS);
            } catch (Throwable e) {
                logger.error("Error onConnect", e);
            }
        }

        @OnWebSocketMessage
        public void onMessage(String message) {
            try {
                JSONObject input = new JSONObject(message);
                if (input.has("apiToken")) {
                    unsubscribe();
                    tagPaths.clear();

                    String apiToken = input.getString("apiToken");
                    String secret = input.getString("secret");
                    APITokenValidation validation = APITokenValidation.validateToken(context, apiToken, secret);

                    if (validation.isSuccess()) {
                        this.defaultTagProvider = input.getString("defaultTagProvider");
                        JSONArray jsonArray = input.getJSONArray("tagPaths");
                        for (int i = 0; i < jsonArray.length(); i++) {
                            TagPath tagPath = TagPathParser.parseSafe(defaultTagProvider, jsonArray.getString(i));
                            if (tagPath == null) {
                                sendError("Tag path '" + jsonArray.getString(i) + "' is invalid");
                                tagPaths.clear();
                                return;
                            } else {
                                tagPaths.add(tagPath);
                            }
                        }

                        subscribe();
                    } else {
                        sendError(validation.getErrorMessage());
                    }
                } else {
                    sendError("Invalid message");
                }
            } catch (Throwable ex) {
                String errorMessage = "Unable to parse message as JSON: " + ex.getMessage();
                logger.warn(errorMessage, ex);
                sendError(errorMessage);
            }
        }

        @Override
        public void tagChanged(TagChangeEvent tagChangeEvent) throws InvalidListenerException {
            try {
                JSONObject ret = new JSONObject();
                JSONObject result = new JSONObject();
                NodeREDServlet.setTagValue(Arrays.asList(tagChangeEvent.getTagPath()), Arrays.asList(tagChangeEvent.getValue()), result);
                ret.put("ignitionResult", result);
                ret.put("statusCode", 1);
                ret.put("errorMessage", "");
                session.sendText(ret.toString(), new Callback.Completable());
            } catch (Throwable e) {
                logger.error("Error sending tag value", e);
            }
        }

        @Override
        public void run() {
            try {
                session.sendPing(ByteBuffer.allocate(0), new Callback.Completable());
            } catch(Throwable t){
                logger.error("Error sending websocket ping", t);
            }
        }
    }
}
