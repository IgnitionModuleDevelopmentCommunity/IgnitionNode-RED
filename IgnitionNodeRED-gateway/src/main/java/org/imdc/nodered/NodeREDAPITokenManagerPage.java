package org.imdc.nodered;

import com.inductiveautomation.ignition.gateway.localdb.persistence.RecordMeta;
import com.inductiveautomation.ignition.gateway.web.components.RecordActionTable;
import com.inductiveautomation.ignition.gateway.web.models.ConfigCategory;
import com.inductiveautomation.ignition.gateway.web.models.DefaultConfigTab;
import com.inductiveautomation.ignition.gateway.web.models.IConfigTab;
import com.inductiveautomation.ignition.gateway.web.pages.IConfigPage;
import org.apache.commons.lang3.tuple.Pair;

import java.util.ArrayList;
import java.util.List;

public class NodeREDAPITokenManagerPage extends RecordActionTable<NodeREDAPITokens> {

    transient List<ICalculatedField<NodeREDAPITokens>> calcFields;

    public static ConfigCategory CONFIG_CATEGORY = new ConfigCategory("NodeRED", "NodeRED.MenuTitle");
    public static IConfigTab MENU_ENTRY = DefaultConfigTab.builder()
            .category(CONFIG_CATEGORY)
            .name("apitokens")
            .i18n("NodeRED.APITokens.MenuTitle")
            .page(NodeREDAPITokenManagerPage.class)
            .terms("Node-RED", "api", "token", "secret")
            .build();

    public NodeREDAPITokenManagerPage(IConfigPage configPage) {
        super(configPage);
    }

    @Override
    protected RecordMeta<NodeREDAPITokens> getRecordMeta() {
        return NodeREDAPITokens.META;
    }

    @Override
    public Pair<String, String> getMenuLocation() {
        return MENU_ENTRY.getMenuLocation();
    }

    @Override
    protected String getTitleKey() {
        return "NodeRED.PageTitle";
    }

    @Override
    protected List<ICalculatedField<NodeREDAPITokens>> getCalculatedFields() {
        if (calcFields == null) {
            calcFields = new ArrayList<>(1);
            calcFields.add(new ICalculatedField<NodeREDAPITokens>() {
                @Override
                public String getFieldvalue(NodeREDAPITokens record) {
                    return Boolean.toString(record.getBoolean(record.Enabled));
                }

                @Override
                public String getHeaderKey() {
                    return "NodeRED.Enabled.Name";
                }
            });
        }
        return calcFields;
    }

    @Override
    protected String getNoRowsKey() {
        return "NodeRED.APITokens.NoRows";
    }
}
