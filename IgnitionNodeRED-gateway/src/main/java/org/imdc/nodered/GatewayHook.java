package org.imdc.nodered;

import com.google.common.collect.Lists;
import com.inductiveautomation.ignition.common.BundleUtil;
import com.inductiveautomation.ignition.common.licensing.LicenseState;
import com.inductiveautomation.ignition.gateway.model.AbstractGatewayModuleHook;
import com.inductiveautomation.ignition.gateway.model.GatewayContext;
import com.inductiveautomation.ignition.gateway.web.models.ConfigCategory;
import com.inductiveautomation.ignition.gateway.web.models.IConfigTab;
import org.imdc.nodered.servlet.NodeREDServlet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.SQLException;
import java.util.List;

public class GatewayHook extends AbstractGatewayModuleHook {

    private final Logger logger = LoggerFactory.getLogger(getClass());
    private GatewayContext gatewayContext;

    @Override
    public void setup(GatewayContext gatewayContext) {
        this.gatewayContext = gatewayContext;

        try {
            gatewayContext.getSchemaUpdater().updatePersistentRecords(NodeREDAPITokens.META);
        } catch (SQLException e) {
            logger.error("Error verifying schemas.", e);
        }

        BundleUtil.get().addBundle("NodeRED", GatewayHook.class, "NodeRED");
    }

    @Override
    public void startup(LicenseState licenseState) {
        gatewayContext.addServlet(NodeREDServlet.PATH, NodeREDServlet.class);
    }

    @Override
    public void shutdown() {
        gatewayContext.removeServlet(NodeREDServlet.PATH);
        BundleUtil.get().removeBundle("NodeRED");
    }

    @Override
    public List<? extends IConfigTab> getConfigPanels() {
        return Lists.newArrayList(NodeREDAPITokenManagerPage.MENU_ENTRY);
    }

    @Override
    public List<ConfigCategory> getConfigCategories() {
        return Lists.newArrayList(NodeREDAPITokenManagerPage.CONFIG_CATEGORY);
    }

//    @Override
//    public boolean isFreeModule() {
//        return true;
//    }
}
