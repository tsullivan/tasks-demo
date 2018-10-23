export async function runFreeformTask(server, context) {
  const { callWithRequest } = server.plugins.elasticsearch.getCluster('data');

  const result = await callWithRequest(context.params, 'search', {
    index: 'bla',
  });
  console.log({ result: JSON.stringify(result) });

  return {
    state: {
      ran: true,
    },
  };
}
