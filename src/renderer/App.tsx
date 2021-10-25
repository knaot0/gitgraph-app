import { useRef, useState } from 'react';
import { MemoryRouter as Router, Switch, Route } from 'react-router-dom';

import { DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Input, Layout, Select, Space } from 'antd';

import domToImage from 'dom-to-image';
import { saveAs } from 'file-saver';

import { Gitgraph, Mode, Orientation, TemplateName } from '@gitgraph/react';
import type { ReactSvgElement } from '@gitgraph/react/lib/types';
import type { BranchUserApi, GitgraphUserApi } from '@gitgraph/core';

import './App.css';
import 'antd/dist/antd.css';

const { Footer, Content } = Layout;
const { Option } = Select;

const Root: React.VFC = () => {
  const ref = useRef<HTMLDivElement | null>(null);

  const [gitgraph, setGitgraph] = useState<GitgraphUserApi<ReactSvgElement>>();
  const [isCompact, setIsCompact] = useState(false);
  const [orientation, setOrientation] = useState<Orientation>();
  const [template, setTemplate] = useState<TemplateName>(TemplateName.Metro);

  const [branches, setBranches] = useState<
    Array<BranchUserApi<ReactSvgElement>>
  >([]);

  const reset = () => {
    if (!gitgraph) return;
    gitgraph.clear();
    setBranches([gitgraph.branch('master')]);
  };

  const download = () => {
    if (!ref.current) return;
    domToImage
      .toBlob(ref.current)
      .then((blob) => saveAs(blob, 'gitgraph.png'))
      .catch((e) => console.error(e));
  };

  return (
    <Layout>
      <Content
        style={{
          height: 800,
        }}
      >
        <Space align="center">
          <div
            ref={ref}
            style={{
              overflow: 'auto',
              background: 'white',
              width: 800,
              height: 800,
              padding: 20,
            }}
          >
            <Gitgraph
              key={`${isCompact}_${orientation}_${template}`}
              options={{
                mode: isCompact ? Mode.Compact : undefined,
                orientation,
                template,
              }}
            >
              {(gitgraph) => {
                setGitgraph(gitgraph);
                setBranches([gitgraph.branch('master')]);
              }}
            </Gitgraph>
          </div>
          <Space direction="vertical" style={{ margin: 20 }}>
            <Form<{ commitMessage: string }>
              layout="inline"
              onFinish={({ commitMessage }) => {
                gitgraph?.commit(commitMessage);
              }}
            >
              <Form.Item name="commitMessage">
                <Input placeholder="Commit message" />
              </Form.Item>

              <Form.Item>
                <Button type="default" htmlType="submit">
                  Commit on HEAD
                </Button>
              </Form.Item>
            </Form>

            {branches.map((branch) => (
              <Form<{ commitMessage: string }>
                key={branch.name}
                layout="inline"
                onFinish={({ commitMessage }) => {
                  branch.commit(commitMessage);
                }}
              >
                <Form.Item name="commitMessage">
                  <Input placeholder="Commit message" />
                </Form.Item>

                <Form.Item>
                  <Button type="default" htmlType="submit">
                    Commit on {branch.name}
                  </Button>
                </Form.Item>
              </Form>
            ))}

            <Form<{ branchName: string }>
              layout="inline"
              onFinish={({ branchName }) => {
                if (
                  !gitgraph ||
                  branches.map((b) => b.name).includes(branchName)
                )
                  return;

                setBranches([...branches, gitgraph.branch(branchName)]);
              }}
            >
              <Form.Item name="branchName">
                <Input placeholder="Branch name" />
              </Form.Item>

              <Form.Item>
                <Button type="default" htmlType="submit">
                  Add a branch
                </Button>
              </Form.Item>
            </Form>

            {orientation !== Orientation.Horizontal &&
              orientation !== Orientation.HorizontalReverse && (
                <Form<{ tagName: string }>
                  layout="inline"
                  onFinish={({ tagName }) => {
                    if (!gitgraph) return;
                    gitgraph.tag(tagName);
                  }}
                >
                  <Form.Item name="tagName">
                    <Input placeholder="Tag name" />
                  </Form.Item>

                  <Form.Item>
                    <Button type="default" htmlType="submit">
                      Add a tag
                    </Button>
                  </Form.Item>
                </Form>
              )}

            {branches.map((to) =>
              branches
                .filter((from) => to.name !== from.name)
                .map((from) => (
                  <Button
                    type="default"
                    key={`${to.name}->${from.name}`}
                    onClick={() => from.merge(to)}
                  >
                    Merge {to.name} into {from.name}
                  </Button>
                ))
            )}

            <Space>
              <Button danger icon={<DeleteOutlined />} onClick={reset}>
                Reset
              </Button>

              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={download}
              >
                Download
              </Button>
            </Space>
          </Space>
        </Space>
      </Content>
      <Footer
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Space size="large">
          <Select<TemplateName>
            value={template}
            onChange={(value) => {
              reset();
              setTemplate(value);
            }}
          >
            <Option value={TemplateName.Metro}>Metro</Option>
            <Option value={TemplateName.BlackArrow}>BlackArrow</Option>
          </Select>

          <Select<Orientation | undefined>
            value={orientation}
            placeholder="Select orientation"
            allowClear
            onChange={(value) => {
              reset();
              setOrientation(value);
            }}
          >
            <Option value={Orientation.Horizontal}>Horizontal</Option>
            <Option value={Orientation.HorizontalReverse}>
              HorizontalReverse
            </Option>
            <Option value={Orientation.VerticalReverse}>VerticalReverse</Option>
          </Select>

          <Checkbox
            checked={isCompact}
            onChange={() => {
              reset();
              setIsCompact(!isCompact);
            }}
          >
            Compact
          </Checkbox>
        </Space>
      </Footer>
    </Layout>
  );
};

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={Root} />
      </Switch>
    </Router>
  );
}
