import { validateRecord } from "@/../lexicon-api/types/app/gainforest/organization/info";
import useRecord from "@/hooks/use-record";
import { AppGainforestOrganizationInfo } from "@/../lexicon-api";

const useOrganizationInfo = (organizationDid: string | undefined) => {
  const { data, isPending, isLoading, error } =
    useRecord<AppGainforestOrganizationInfo.Record>(
      "app.gainforest.organization.info",
      organizationDid,
      "self",
      validateRecord
    );

  return {
    organizationInfo: data,
    isOrganizationInfoPending: isPending,
    isOrganizationInfoLoading: isLoading,
    organizationInfoError: error,
  };
};

export default useOrganizationInfo;
