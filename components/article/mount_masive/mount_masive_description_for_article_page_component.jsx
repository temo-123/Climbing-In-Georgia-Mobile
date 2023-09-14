import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import RenderHtml from "react-native-render-html";
import { gStyle } from "../../../assets/styles/styles";
import axios from "axios";

export default function MasiveDescription({ article_id }) {
  const [mountMasive, setMountMasive] = useState([]);

  useEffect(() => {
    // console.log("🚀 ~ file: mount_masive_description_for_article_page_component.jsx:17 ~ .then ~ article_id:", article_id)
    const baseUrl =
      "https://climbing.ge/api/mount/on_page/en/" + article_id;
    axios
      .get(baseUrl)
      .then(({ data }) => {
        setMountMasive(data);
        // console.log("🚀 ~ file: mount_masive_description_for_article_page_component.jsx:17 ~ .then ~ data:", data)
      })
      .catch((error) => {
        Alert.alert("ERROR!", "Axios request is fale");
      })
      .finally(function () {
        // always executes at the last of any API call
      });
  }, []);

  return (
    <View style={styles.container}>
      <Text>mount description</Text>
      <Text>{ mountMasive }</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // padding: '2%',
    // alignItems: 'center',
  },
  page_header_title: {
    fontSize: 20,
  },
  page_heheader_text: {
    fontSize: 12,
    paddingTop: "2%",
  },
  horizontal: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 26,
    paddingRight: 26,
  },
  horizontal_line: {
    flex: 1,
    height: 1,
    backgroundColor: "#000",
  },
});
