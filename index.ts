type Data = {
  collection: {
    links: {
      name: string;
      link: {
        url: string;
      };
    }[];
  };
};

const query = (page: number) => `
  {
    collection: object {
      ... on Collection {
        links: contents(page: ${page}, per: 50, sortBy: CREATED_AT_ASC) {
          name: value
          link: entity {
            ... on Link {
              url
            }
          }
        }
      }
    }
  }
`;

const tag = (html: string) =>
  new DOMParser().parseFromString(html, "text/html").body.firstChild;

const ENDPOINT =
  "https://atlas.auspic.es/graph/6912ccab-cdeb-4d70-b675-b6aafae56746";

const STATE = { page: 1 };

const DOM = {
  root: document.getElementById("root"),
  links: document.getElementById("links"),
  sentinel: document.getElementById("sentinel"),
};

const observer = new IntersectionObserver((entries) => {
  if (entries.some((entry) => entry.intersectionRatio > 0)) {
    request(STATE.page++);
  }
});

const render = ({ collection: { links } }: Data) => {
  return tag(
    `<div>${links
      .map(({ name, link: { url } }) => {
        const label = url.replace(/(^\w+:|^)\/\//, "").replace(/\/$/, "");
        return `
          <a href="${url}" title="${name}" rel="nofollow" target="_blank">
            see also &lt;${label}&gt;
          </a>
        `;
      })
      .join("")}</div>`
  );
};

const request = (page: number = STATE.page) =>
  fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: query(page) }),
  })
    .then((res) => res.json())
    .then(({ data }: { data: Data }) => {
      if (data.collection.links.length === 0) {
        observer.disconnect();
        DOM.root.removeChild(DOM.sentinel);
        return;
      }

      DOM.links.appendChild(render(data));
    });

const init = () => {
  if (document.body.clientHeight < document.documentElement.clientHeight) {
    request().then(init);
    return;
  }

  observer.observe(DOM.sentinel);
};

init();
