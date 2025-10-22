import { validateRecord } from "@/../lexicon-api/types/app/gainforest/organization/info";
import useRecord from "@/hooks/use-record";
import { AppGainforestOrganizationDefaultSite } from "@/../lexicon-api";

const useDefaultSite = (organizationDid: string | undefined) => {
  const { data, isPending, isLoading, error } =
    useRecord<AppGainforestOrganizationDefaultSite.Record>(
      "app.gainforest.organization.defaultSite",
      organizationDid,
      "self",
      validateRecord
    );

  return {
    defaultSite: data,
    isDefaultSitePending: isPending,
    isDefaultSiteLoading: isLoading,
    defaultSiteError: error,
  };
};

export default useDefaultSite;
