import { useRef, useState } from 'react';
import { MemoryRouter as Router, Switch, Route } from 'react-router-dom';

import { DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Divider,
  Form,
  Input,
  Layout,
  notification,
  Select,
  Space,
} from 'antd';

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

  const [currentBranch, setCurrentBranch] =
    useState<BranchUserApi<ReactSvgElement>>();

  const [branches, setBranches] = useState<
    Array<BranchUserApi<ReactSvgElement>>
  >([]);

  const reset = () => {
    if (!gitgraph) return;
    gitgraph.clear();
    const masterBranch = gitgraph.branch('master');
    setCurrentBranch(masterBranch);
    setBranches([masterBranch]);
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
                const masterBranch = gitgraph.branch('master');
                setCurrentBranch(masterBranch);
                setBranches([masterBranch]);
                setGitgraph(gitgraph);
              }}
            </Gitgraph>
          </div>
          <Space direction="vertical" style={{ margin: 20 }}>
            <Form<{
              fromName: string;
              toName: string;
            }>
              onFinish={({ fromName, toName }) => {
                const branch = branches.find((b) => b.name === toName);
                branch?.merge(fromName);
              }}
            >
              <Form.Item name="fromName" label="Source branch">
                <Select placeholder="Source branch">
                  {branches.map((branch) => (
                    <Option value={branch.name}>{branch.name}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="toName" label="Target branch">
                <Select placeholder="Target branch">
                  {branches.map((branch) => (
                    <Option value={branch.name}>{branch.name}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Merge
                </Button>
              </Form.Item>
            </Form>

            <Divider />

            <Form.Item label="Current branch">
              <Select<string>
                placeholder="Source branch"
                value={currentBranch?.name}
                onChange={(branchName) => {
                  const branch = branches.find((b) => b.name === branchName);
                  if (!branch) return;
                  setCurrentBranch(branch);
                }}
              >
                {branches.map((branch) => (
                  <Option value={branch.name}>{branch.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form<{ commitMessage: string }>
              layout="inline"
              onFinish={({ commitMessage }) => {
                currentBranch?.commit(commitMessage);
              }}
            >
              <Form.Item name="commitMessage">
                <Input placeholder="Commit message" />
              </Form.Item>

              <Form.Item>
                <Button type="default" htmlType="submit">
                  Commit
                </Button>
              </Form.Item>
            </Form>

            <Form<{ branchName: string }>
              layout="inline"
              onFinish={({ branchName }) => {
                if (!branchName) {
                  notification.error({
                    message: `Please input a new branch name!`
                  })
                }

                if (
                  !gitgraph ||
                  branches.map((b) => b.name).includes(branchName)
                )
                  return;

                const newBranch = gitgraph.branch(branchName)
                setBranches([...branches, newBranch]);
                setCurrentBranch(newBranch)
                notification.success({
                  message: `Switched to a new branch '${branchName}'`
                })
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

            <Divider />

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
