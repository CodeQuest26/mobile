import MainContainer from "@/components/MainContainer";
import PostJobForm from "@/components/sme/PostJobForm";
import React, { useState } from "react";
import { StyleSheet } from "react-native";
import Spacer from "@/components/Spacer";

const postJob = () => {
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  return (
    <MainContainer safe>
        <Spacer style={{height: 20}}/>
      <PostJobForm />
    </MainContainer>
  );
};

export default postJob;

const styles = StyleSheet.create({});
