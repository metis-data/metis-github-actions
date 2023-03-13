const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios');
const { context } = require('@actions/github');
const octokit = github.getOctokit(core.getInput('github_token'));

const { pull_request, issue } = context.payload;

const commentPr = async (testName) => {
  try {
    const urlPrefix = core.getInput('target_url');
    const apiKey = core.getInput('metis_api_key');
    await octokit.rest.issues.createComment({
      ...context.repo,
      issue_number: pull_request ? pull_request.number : issue ? issue.number : 0,
      body: `Metis just analyzed the SQL commands generated by the test. View the results in the link: ${encodeURI(`${urlPrefix}/projects/${apiKey}/test/${testName}`)}`,
    });
  } catch (error) {
    console.error(error);
    core.setFailed(error);
  }
};

const createNewTest = async (testName, prId, prUrl) => {
  try {
    const urlPrefix = core.getInput('target_url');
    const apiKey = core.getInput('metis_api_key');
    await axios.post(
      `${urlPrefix}/api/tests/create`,
      {
        prName: testName,
        prId,
        prUrl,
        apiKey,
      },
      {
        headers: {
          'x-api-key': apiKey,
        },
      }
    );
  } catch (error) {
    core.setFailed(error);
  }
};

async function main() {
  try {
    const testName = pull_request?.title || context.sha;
    const prId = `${pull_request?.number}`;
    const prUrl = pull_request.html_url;
    core.setOutput('pr_tag', testName);
    await createNewTest(testName, prId, prUrl);

    if (pull_request?.title !== undefined) {
      await commentPr(testName);
    }
  } catch (error) {
    console.error(error);
    core.setFailed(error);
  }
}

main();
