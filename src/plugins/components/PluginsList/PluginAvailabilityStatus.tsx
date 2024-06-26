// @ts-strict-ignore
import { Pill } from "@dashboard/components/Pill";
import { PluginBaseFragment } from "@dashboard/graphql";
import { isPluginGlobal } from "@dashboard/plugins/views/utils";
import React from "react";
import { useIntl } from "react-intl";

import { pluginAvailabilityStatusMessages as messages, pluginStatusMessages } from "./messages";
import { getActiveChannelConfigsCount } from "./utils";

interface PluginAvailabilityStatusProps {
  plugin: PluginBaseFragment;
}

const PluginAvailabilityStatus: React.FC<PluginAvailabilityStatusProps> = ({
  plugin: { globalConfiguration, channelConfigurations },
}) => {
  const intl = useIntl();
  const isGlobalPlugin = isPluginGlobal(globalConfiguration);
  const activeChannelsCount = getActiveChannelConfigsCount(channelConfigurations);
  const isStatusActive = isGlobalPlugin ? globalConfiguration.active : !!activeChannelsCount;
  const globalPluginLabel = intl.formatMessage(
    isStatusActive ? pluginStatusMessages.active : pluginStatusMessages.deactivated,
  );

  return (
    <Pill
      label={
        isGlobalPlugin
          ? globalPluginLabel
          : intl.formatMessage(messages.channelTitle, {
              activeChannelsCount,
            })
      }
      color={isStatusActive ? "success" : "error"}
      outlined
    />
  );
};

export default PluginAvailabilityStatus;
