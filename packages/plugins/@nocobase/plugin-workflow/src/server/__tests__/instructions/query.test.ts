import { Application } from '@nocobase/server';
import Database from '@nocobase/database';
import { getApp, sleep } from '..';
import { EXECUTION_STATUS, JOB_STATUS } from '../../constants';

describe('workflow > instructions > query', () => {
  let app: Application;
  let db: Database;
  let PostCollection;
  let PostRepo;
  let TagModel;
  let CommentRepo;
  let WorkflowModel;
  let workflow;

  beforeEach(async () => {
    app = await getApp();

    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostCollection = db.getCollection('posts');
    PostRepo = PostCollection.repository;
    CommentRepo = db.getCollection('comments').repository;
    TagModel = db.getCollection('tags').model;

    workflow = await WorkflowModel.create({
      title: 'test workflow',
      enabled: true,
      type: 'collection',
      config: {
        mode: 1,
        collection: 'posts',
      },
    });
  });

  afterEach(() => app.destroy());

  describe('query one', () => {
    it('params: empty', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.title).toBe(post.title);
    });

    it('params.filter: match', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          params: {
            filter: {
              title: 't1',
            },
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.title).toBe(post.title);
    });

    it('params.filter: unmatch', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          params: {
            filter: {
              title: 't2',
            },
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result).toBe(null);
    });

    it('params.filter: value from context', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          params: {
            filter: {
              title: '{{$context.data.title}}',
            },
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.title).toBe(post.title);
    });

    it('params.filter: value from job of node', async () => {
      const n1 = await workflow.createNode({
        type: 'echo',
      });
      const n2 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          params: {
            filter: {
              title: `{{$jobsMapByNodeKey.${n1.key}.data.title}}`,
            },
          },
        },
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs[1].result.title).toBe(post.title);
    });

    it('params.filter: by association field', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'tags',
          params: {
            filter: {
              'posts.id': `{{$context.data.id}}`,
            },
          },
        },
      });

      const tag = await TagModel.create({ name: 'tag1' });
      const post = await PostRepo.create({
        values: { title: 't1', tags: [tag.id] },
      });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.id).toBe(tag.id);
    });

    it('params.appends: hasMany', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          params: {
            appends: ['comments'],
          },
        },
      });

      const comment = await CommentRepo.create({});
      const post = await PostRepo.create({
        values: { title: 't1', comments: [comment.id] },
      });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.comments.length).toBe(1);
      expect(job.result.comments[0].id).toBe(comment.id);
    });

    it('params.appends: belongsToMany', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'tags',
          params: {
            appends: ['posts'],
          },
        },
      });

      const tag = await TagModel.create({ name: 'tag1' });
      const post = await PostRepo.create({
        values: { title: 't1', tags: [tag.id] },
      });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.posts.length).toBe(1);
      expect(job.result.posts[0].id).toBe(post.id);
    });

    it('params.sort', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          params: {
            sort: [{ field: 'id', direction: 'asc' }],
          },
        },
      });

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const p2 = await PostRepo.create({ values: { title: 't2' } });

      await sleep(500);

      // get the 2nd execution
      const [execution] = await workflow.getExecutions({ order: [['id', 'DESC']] });
      expect(execution.context.data.title).toBe(p2.title);
      const [job] = await execution.getJobs();
      expect(job.result.title).toBe(p1.title);
    });
  });

  describe('query all', () => {
    it('params: empty', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          multiple: true,
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.length).toBe(1);
      expect(job.result[0].title).toBe(post.title);
    });

    it('params.filter: match', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          multiple: true,
          params: {
            filter: {
              title: 't1',
            },
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.length).toBe(1);
      expect(job.result[0].title).toBe(post.title);
    });

    it('params.filter: unmatch', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          multiple: true,
          params: {
            filter: {
              title: 't2',
            },
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.length).toBe(0);
    });

    it('params.sort & params.page & params.pageSize', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          multiple: true,
          params: {
            sort: [{ field: 'id', direction: 'asc' }],
            page: 1,
            pageSize: 1,
          },
        },
      });

      const p1 = await PostRepo.create({ values: { title: 't1' } });
      const p2 = await PostRepo.create({ values: { title: 't2' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.length).toBe(1);
      expect(job.result[0].title).toBe(p1.title);
    });
  });

  describe('failOnEmpty', () => {
    it('failOnEmpty', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'categories',
          failOnEmpty: true,
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.FAILED);
      const [job] = await execution.getJobs();
      expect(job.status).toBe(JOB_STATUS.FAILED);
      expect(job.result).toBe(null);
    });

    it('failOnEmpty && multiple', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'categories',
          multiple: true,
          failOnEmpty: true,
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.FAILED);
      const [job] = await execution.getJobs();
      expect(job.result).toMatchObject([]);
    });
  });
});
