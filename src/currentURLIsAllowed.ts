export const currentURLIsAllowed = (url: string, config: string[]): boolean => {
  const urlsConfig: string[] = config;
  let result = false;

  let currentUrl = url;

  // Remove Query Params
  currentUrl = currentUrl.split('?')[0].split('#')[0];

  // Remove last slash to be sure to have same url
  if (currentUrl !== '/' && currentUrl.slice(-1) === '/') {
    currentUrl = currentUrl.slice(0, -1);
  }

  for (let index = 0; index < urlsConfig.length; index += 1) {
    const urlConfig = urlsConfig[index];

    //If url ends with *, just check that url is similar without *
    if (urlConfig.endsWith('/*')) {
      if (currentUrl.startsWith(urlConfig.replace('/*', ''))) {
        result = true;
        break;
      }
    }

    // Check current url are in config
    if (currentUrl === urlConfig) {
      result = true;
      break;
    }

    // Ignore dynamic paremeters and check
    if (urlConfig.indexOf('/:') !== -1) {
      const splitUrl = currentUrl.split('/');
      const splitConfigUrl = urlConfig.split('/');

      if (splitUrl.length === splitConfigUrl.length) {
        let similar = true;
        for (let j = 0; j < splitUrl.length; j += 1) {
          if (
            splitConfigUrl[j].indexOf(':') === -1 &&
            splitUrl[j] !== splitConfigUrl[j]
          ) {
            similar = false;
            break;
          }
        }

        // If Everything is similar (with parameters)
        if (similar) {
          result = true;
          break;
        }
      }
    }
  }

  return result;
};
