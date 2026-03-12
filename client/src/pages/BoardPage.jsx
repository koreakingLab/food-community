import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Board from '../components/Board';
import PostDetail from '../components/PostDetail';

function BoardWrapper({ type, title }) {
  return (
    <Routes>
      <Route index element={<Board type={type} title={title} />} />
      <Route path=":id" element={<PostDetail type={type} />} />
    </Routes>
  );
}

export default BoardWrapper;