export const SAMPLE_IDS = `001xx000003DGbY
001xx000003DGbYAAW
003xx000004TmiQAAS`;

export const SAMPLE_SOQL = `select id,name,industry,(select lastname,email from contacts where email != null order by lastname) from account where billingcountry = 'USA' and createddate = last_n_days:30 order by name limit 25`;

export const SAMPLE_FORMULA = `IF(
  AND(
    ISPICKVAL(Status__c, "Active"),
    Amount__c > 1000
  ),
  HYPERLINK("/" & Id, Name, "_blank"),
  "Review"
)`;

export const SAMPLE_IN_CLAUSE_VALUES = `Acme
Global Media
Acme
United Oil & Gas
GenePoint`;

export const SAMPLE_JSON = `{"account":{"id":"001xx000003DGbYAAW","name":"Acme","industry":"Manufacturing","active":true},"contacts":[{"firstName":"Ada","lastName":"Lovelace","email":"ada@example.com"},{"firstName":"Grace","lastName":"Hopper","email":"grace@example.com"}],"annualRevenue":1250000}`;

export const SAMPLE_JSON_LEFT = `{"account":{"id":"001xx000003DGbYAAW","name":"Acme","status":"Active","contacts":["Ada","Grace"],"preferences":{"tier":"Gold","notifications":true}}}`;

export const SAMPLE_JSON_RIGHT = `{"account":{"id":"001xx000003DGbYAAW","name":"Acme Corp","status":"Active","contacts":["Ada","Grace","Linus"],"preferences":{"tier":"Platinum","notifications":false}}}`;

export const SAMPLE_XML = `<account id="001xx000003DGbYAAW"><name>Acme</name><industry>Manufacturing</industry><contacts><contact><firstName>Ada</firstName><lastName>Lovelace</lastName></contact><contact><firstName>Grace</firstName><lastName>Hopper</lastName></contact></contacts></account>`;

export const SAMPLE_HTML = `<section class="card"><h1>Release Notes</h1><p>Sample preview content for the formatter.</p><ul><li>Improved diffing</li><li>Added sample loader</li></ul></section>`;

export const SAMPLE_TEXT_DIFF_LEFT = `Acme
GenePoint
United Oil & Gas
Express Logistics`;

export const SAMPLE_TEXT_DIFF_RIGHT = `Acme
GenePoint
United Oil & Gas
Universal Containers`;

export const SAMPLE_TEXT_PROCESSOR_INPUT = `  acme  
genepoint
Acme

united oil & gas`;

export const SAMPLE_BASE64_TEXT = `Salesforce sample payload`;
export const SAMPLE_BASE64_ENCODED = `U2FsZXNmb3JjZSBzYW1wbGUgcGF5bG9hZA==`;

export const SAMPLE_URL_TEXT = `https://example.com/search?q=salesforce tools&sort=updated#results`;
export const SAMPLE_URL_ENCODED = `https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dsalesforce%20tools%26sort%3Dupdated%23results`;

export const SAMPLE_JWT_TOKEN = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMDV4eDAwMDAwMVN2NmRBQUMiLCJuYW1lIjoiU2FtcGxlIFVzZXIiLCJzY29wZSI6WyJhcGkiLCJyZWZyZXNoX3Rva2VuIl0sImlhdCI6MTcxMDAwMDAwMH0.8NM7haqUEJhZKV3qridoVbC0m1douUm5ugW5c4kU45o`;
export const SAMPLE_JWT_SECRET = `sample-secret`;

export const SAMPLE_OMNI_LEFT = `<OmniScript>
  <propertySetConfig>{"emailBody":"Hello &lt;b&gt;Acme&lt;/b&gt;\\nThanks for your order.","step":"Review","version":1}</propertySetConfig>
</OmniScript>`;

export const SAMPLE_OMNI_RIGHT = `<OmniScript>
  <propertySetConfig>{"emailBody":"Hello &lt;b&gt;Acme Team&lt;/b&gt;\\nThanks for your updated order.","step":"Review","version":2}</propertySetConfig>
</OmniScript>`;
