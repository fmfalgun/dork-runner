// dork-queries.js — combiner
// Requires dork-queries-google.js and dork-queries-ddg.js loaded before this file
// dork-runner.html loads: dork-queries-google.js → dork-queries-ddg.js → dork-queries.js → dork-runner.js

const DORK_QUERIES = {
  google: DORK_QUERIES_GOOGLE,
  ddg:    DORK_QUERIES_DDG,
  CATEGORIES: [
    { id: 'directory-listings',  label: 'Directory Listings'  },
    { id: 'file-exposure',       label: 'File Exposure'        },
    { id: 'admin-panels',        label: 'Admin Panels'         },
    { id: 'credentials',         label: 'Credentials'          },
    { id: 'error-messages',      label: 'Error Messages'       },
    { id: 'sqli-candidates',     label: 'SQLi Candidates'      },
    { id: 'cms-detection',       label: 'CMS Detection'        },
    { id: 'cloud-infra',         label: 'Cloud / Infra'        },
    { id: 'paste-leaks',         label: 'Paste Leaks'          },
    { id: 'email-enumeration',   label: 'Email / Users'        },
    { id: 'subdomain-discovery', label: 'Subdomain Discovery'  },
    { id: 'document-exposure',   label: 'Documents'            },
    { id: 'misc',                label: 'Miscellaneous'        },
  ]
};
