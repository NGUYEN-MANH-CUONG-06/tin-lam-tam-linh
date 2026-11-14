function isDemoAutoActivationEnabled(environment) {
  return environment?.NODE_ENV !== "production" && environment?.TLTL_DEMO_AUTO_PUBLISH === true;
}

module.exports = { isDemoAutoActivationEnabled };
