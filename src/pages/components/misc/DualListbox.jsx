import React, { useState } from "react";
import Head from "@/layout/head/Head";
import Content from "@/layout/content/Content";
import {
  Block,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  BlockDes,
  BackTo,
  PreviewCard,
  DualList,
} from "@/components/Component";

const BasicDualList = () => {
  const [selected, setSelected] = useState([]);
  const allOptions = [
    { value: "1", label: "Cheese" },
    { value: "2", label: "Egg" },
    { value: "3", label: "Butter" },
    { value: "4", label: "Margarine" },
    { value: "5", label: "Yogurt" },
    { value: "6", label: "Pizza" },
    { value: "7", label: "Steak" },
    { value: "8", label: "Kebab" },
    { value: "9", label: "Sandwich" },
    { value: "10", label: "Hamburger" },
  ];
  return (
    <div>
      <DualList
        options={allOptions}
        selected={selected}
        onChange={setSelected}
        leftHeader="Available Options"
        rightHeader="Selected Options"
        showSearch={true}
      />
    </div>
  );
}

const PreSelectedDualList = () => {
  const [selected, setSelected] = useState(['2', '4']);
  const allOptions = [
    { value: "1", label: "Cheese" },
    { value: "2", label: "Egg" },
    { value: "3", label: "Butter" },
    { value: "4", label: "Margarine" },
    { value: "5", label: "Yogurt" },
    { value: "6", label: "Pizza" },
    { value: "7", label: "Steak" },
    { value: "8", label: "Kebab" },
    { value: "9", label: "Sandwich" },
    { value: "10", label: "Hamburger" },
  ];
  return (
    <div>
      <DualList
        options={allOptions}
        selected={selected}
        onChange={setSelected}
        leftHeader="Available Options"
        rightHeader="Selected Options"
        showSearch={true}
      />
    </div>
  );
}

const DualListWithIcon = () => {
  const [selected, setSelected] = useState([]);
  const allOptions = [
    { value: "1", label: "Cheese" },
    { value: "2", label: "Egg" },
    { value: "3", label: "Butter" },
    { value: "4", label: "Margarine" },
    { value: "5", label: "Yogurt" },
    { value: "6", label: "Pizza" },
    { value: "7", label: "Steak" },
    { value: "8", label: "Kebab" },
    { value: "9", label: "Sandwich" },
    { value: "10", label: "Hamburger" },
  ];
  return (
    <div>
      <DualList
        options={allOptions}
        selected={selected}
        onChange={setSelected}
        iconButton={true}
        leftHeader="Available Options"
        rightHeader="Selected Options"
        showSearch={true}
      />
    </div>
  );
}

const DualListNoSearch = () => {
  const [selected, setSelected] = useState([]);
  const allOptions = [
    { value: "1", label: "Cheese" },
    { value: "2", label: "Egg" },
    { value: "3", label: "Butter" },
    { value: "4", label: "Margarine" },
    { value: "5", label: "Yogurt" },
    { value: "6", label: "Pizza" },
    { value: "7", label: "Steak" },
    { value: "8", label: "Kebab" },
    { value: "9", label: "Sandwich" },
    { value: "10", label: "Hamburger" },
  ];
  return (
    <div>
      <DualList
        options={allOptions}
        selected={selected}
        onChange={setSelected}
        leftHeader="Available Options"
        rightHeader="Selected Options"
        showSearch={false}
      />
    </div>
  );
}

const DualListPage = () => {
  return (
    <React.Fragment>
      <Head title="Duallistbox"></Head>
      <Content page="component">
        <BlockHead size="lg" wide="sm">
          <BlockHeadContent>
            <BackTo link="/components" icon="arrow-left">
              Components
            </BackTo>
            <BlockTitle tag="h2" className="fw-normal">
              DualListBox
            </BlockTitle>
            <BlockDes>
              <p className="lead">
                A lightweight dual listbox component for transferring items between available and selected lists. Supports multi-selection with clicks, optional live search filtering, and intuitive arrow buttons for single/bulk moves
              </p>
            </BlockDes>
          </BlockHeadContent>
        </BlockHead>

        <Block size="lg">
          <BlockHead>
            <BlockHeadContent>
              <BlockTitle tag="h5">Basic</BlockTitle>
              <BlockDes>
                Basic example of DualList component.
              </BlockDes>
            </BlockHeadContent>
          </BlockHead>
          <PreviewCard>
              <BasicDualList/>
          </PreviewCard>
        </Block>

        <Block size="lg">
          <BlockHead>
            <BlockHeadContent>
              <BlockTitle tag="h5">Icon Buttons</BlockTitle>
              <BlockDes>
                Add an <code>iconButton</code> props to the <code>DualList component</code> to add icon buttons.
              </BlockDes>
            </BlockHeadContent>
          </BlockHead>
          <PreviewCard>
            <DualListWithIcon />
          </PreviewCard>
        </Block>

        <Block size="lg">
          <BlockHead>
            <BlockHeadContent>
              <BlockTitle tag="h5">Pre Selected</BlockTitle>
              <BlockDes>
                Use an array of index <code>selected</code> props to preselect options.
              </BlockDes>
            </BlockHeadContent>
          </BlockHead>
          <PreviewCard>
            <PreSelectedDualList />
          </PreviewCard>
        </Block>

        <Block size="lg">
          <BlockHead>
            <BlockHeadContent>
              <BlockTitle tag="h5">Without search</BlockTitle>
              <BlockDes>
                Change <code>showSearch</code> props to the <code>false</code> to turnoff search option.
              </BlockDes>
            </BlockHeadContent>
          </BlockHead>
          <PreviewCard>
            <DualListNoSearch />
          </PreviewCard>
        </Block>
      </Content>
    </React.Fragment>
  );
};

export default DualListPage;
