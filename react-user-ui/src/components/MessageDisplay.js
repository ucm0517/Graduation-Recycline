import React from "react";

const MessageDisplay = ({ message }) => {
  return (
    <div style={styles.container}>
      <h2>{message}</h2>
    </div>
  );
};

const styles = {
  container: {
    marginTop: "30px",
    textAlign: "center",
    fontSize: "1.8rem",
  },
};

export default MessageDisplay;
