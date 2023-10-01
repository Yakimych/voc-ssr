import * as pulumi from "@pulumi/pulumi";
import * as mongodbatlas from "@pulumi/mongodbatlas";
import * as random from "@pulumi/random";

const atlasOrgId = "62f3ca7f6f8eed4dde680079";
const project = new mongodbatlas.Project("voc-ssr-project", {
  orgId: atlasOrgId,
});

const atlasCluster = new mongodbatlas.Cluster("voc-ssr-cluster", {
  projectId: project.id,
  name: "shared-cluster",
  clusterType: "REPLICASET",
  providerName: "TENANT",
  backingProviderName: "AZURE",
  providerInstanceSizeName: "M0",
  providerRegionName: "EUROPE_NORTH",
});

const randomPassword = new random.RandomPassword("voc-ssr-password", {
  length: 16,
  special: true,
  overrideSpecial: "_%@",
});

const atlasUserName = "voc-ssr-user";

const atlasUser = new mongodbatlas.DatabaseUser("voc-ssr-user", {
  username: atlasUserName,
  password: randomPassword.result,
  authDatabaseName: "admin",
  projectId: project.id,
  roles: [
    {
      roleName: "readWrite",
      databaseName: "voc-ssr",
    },
  ],
});

export const connectionString = pulumi
  .all([atlasCluster.srvAddress, randomPassword.result])
  .apply(([srvAddress, pass]) => {
    const parts = srvAddress.split("://");
    return `${parts[0]}://${atlasUserName}:${pass}@${parts[1]}`;
  });
