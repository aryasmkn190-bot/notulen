import React, { useEffect } from "react";

const Head = ({ ...props }) => {
  return (
    <Title>{`${props.title ? props.title + " | " : ""}SMK Hassina Sukabumi`}</Title>
  );
};
export default Head;

function Title({ children }) {
  useEffect(() => {
    const prev = document.title;
    document.title = children;

    return () => {
      document.title = prev;
    };
  }, [children]);

  return null;
}
