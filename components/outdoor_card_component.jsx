import styled from 'styled-components/native';

const PostView = styled.View`
  flex-direction: row;
  padding: 15px;
  border-bottom-width: 1px;
  border-bottom-color: rgba(0, 0, 0, 0.1);
  border-bottom-style: solid
`;

const PostImage = styled.Image`
  width: 100px;
  height: 100px;
  border-radius: 12px;
  margin-right: 12px;
`;

const PostTitle = styled.Text`
  font-size: 17px;
  font-weight: 700;
`;

const PostData = styled.Text`
  font-size: 12px;
  color: rgba(0, 0, 0, 0.4);
  margin-top: 2px;
`;

const PostDetales = styled.View`
  flex-diraction: column;
  justify-content: center;
`;

export const Post = ({ title, imageUrl, createdAt}) => {
    return (
        <PostView>
            <PostImage source={{ uri: imageUrl }}/>
            <PostDetales>
                <PostTitle>{title}</PostTitle>
                <PostData>{createdAt}</PostData>
            </PostDetales>
        </PostView>
    )
}
