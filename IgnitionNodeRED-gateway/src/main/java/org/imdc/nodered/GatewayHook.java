package org.imdc.nodered;

import com.inductiveautomation.ignition.common.BundleUtil;
import com.inductiveautomation.ignition.common.licensing.LicenseState;
import com.inductiveautomation.ignition.common.resourcecollection.ResourceType;
import com.inductiveautomation.ignition.gateway.config.ResourceTypeMeta;
import com.inductiveautomation.ignition.gateway.config.migration.IdbMigrationStrategy;
import com.inductiveautomation.ignition.gateway.config.migration.NamedRecordMigrationStrategy;
import com.inductiveautomation.ignition.gateway.model.AbstractGatewayModuleHook;
import com.inductiveautomation.ignition.gateway.model.GatewayContext;
import com.inductiveautomation.ignition.gateway.web.systemjs.SystemJsModule;
import org.imdc.nodered.servlet.NodeREDServlet;
import org.imdc.nodered.servlet.NodeREDWebSocketServlet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Optional;

public class GatewayHook extends AbstractGatewayModuleHook {

    public static final String MODULE_ID = "org.imdc.nodered.IgnitionNodeRED";
    public static final String MODULE_NAME = "Node-RED";
    public static final String PREFIX = "nodered";

    public static final ResourceType TOKEN_RESOURCE_TYPE =
            new ResourceType(MODULE_ID, "token");

    public static final ResourceTypeMeta<NodeREDAPITokenResource> TOKEN_RESOURCE_TYPE_META =
            ResourceTypeMeta.newBuilder(NodeREDAPITokenResource.class)
                    .resourceType(TOKEN_RESOURCE_TYPE)
                    .categoryName("Token")
                    .buildRouteDelegate(routes -> routes
                            .configSchema(NodeREDAPITokenResource.class)
                            .openApiGroupName(MODULE_NAME)
                            .openApiTagName("token")
                    ).build();

    public static SystemJsModule jsModule =
            new SystemJsModule(MODULE_ID,
                    "/res/" + PREFIX + "/ignitionnodered.js");

    private final Logger logger = LoggerFactory.getLogger(getClass());
    private GatewayContext gatewayContext;

    @Override
    public void setup(GatewayContext gatewayContext) {
        this.gatewayContext = gatewayContext;

        gatewayContext.getWebResourceManager().getNavigationModel().getConnections().addCategory(PREFIX, cat -> cat
                .label(MODULE_NAME)
                .addPage("Tokens", page -> page
                        .position(1)
                        .mount("/nodered/tokens", "Tokens", jsModule)
                )
        );

        gatewayContext.getConfigurationManager().getResourceTypeMetaRegistry().register(TOKEN_RESOURCE_TYPE_META);

        BundleUtil.get().addBundle("NodeRED", GatewayHook.class, "NodeRED");
    }

    @Override
    public void startup(LicenseState licenseState) {
        gatewayContext.getWebResourceManager().addServlet(NodeREDServlet.PATH, NodeREDServlet.class);
        gatewayContext.getWebResourceManager().addServlet(NodeREDWebSocketServlet.PATH, NodeREDWebSocketServlet.class);
    }

    @Override
    public void shutdown() {
        gatewayContext.getWebResourceManager().removeServlet(NodeREDServlet.PATH);
        gatewayContext.getWebResourceManager().removeServlet(NodeREDWebSocketServlet.PATH);
        BundleUtil.get().removeBundle("NodeRED");
    }

    @Override
    public List<IdbMigrationStrategy> getRecordMigrationStrategies() {
        return List.of(new NamedRecordMigrationStrategy(NodeREDAPITokens.META, TOKEN_RESOURCE_TYPE));
    }

    @Override
    public Optional<String> getMountedResourceFolder() {
        return Optional.of("mounted");
    }

    @Override
    public Optional<String> getMountPathAlias() {
        return Optional.of(PREFIX);
    }

    @Override
    public boolean isMakerEditionCompatible() {
        return true;
    }
//    @Override
//    public boolean isFreeModule() {
//        return true;
//    }
}
