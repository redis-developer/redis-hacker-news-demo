import { Component } from "react"

import "../styles/pages/comment.css"

import Header from "../components/header.js"
import Footer from "../components/footer.js"
import HeadMetadata from "../components/headMetadata.js"
import Comment from "../components/comment.js"
import CommentSection from "../components/commentSection.js"
import GoogleAnalytics from "../components/googleAnalytics.js"

import truncateCommentText from "../utils/truncateCommentText.js"

import getCommentById from "../api/comments/getCommentById.js"

export default class extends Component {
  static async getInitialProps ({ req, query }) {
    const commentId = query.id ? query.id : ""
    const page = query.page ? parseInt(query.page) : 1

    const apiResult = await getCommentById(commentId, page, req)

    return {
      comment: apiResult && apiResult.comment,
      authUserData: apiResult && apiResult.authUser ? apiResult.authUser : {},
      notFoundError: apiResult && apiResult.notFoundError,
      getDataError: apiResult && apiResult.getDataError,
      goToString: page > 1 ? `comment?id=${commentId}&page=${page}` : `comment?id=${commentId}`,
      page: page,
      isMoreChildrenComments: apiResult && apiResult.isMoreChildrenComments
    }
  }

  render () {
    return (
      <div className="layout-wrapper">
        <HeadMetadata
          title={this.props.comment ? `${truncateCommentText(this.props.comment.pageMetadataTitle)} | Hacker News` : "Hacker News"}
        />
        <GoogleAnalytics />
        <Header
          userSignedIn={this.props.authUserData && this.props.authUserData.userSignedIn}
          username={this.props.authUserData && this.props.authUserData.username}
          karma={this.props.authUserData && this.props.authUserData.karma}
          goto={this.props.goToString}
        />
        <div className="comment-content-container">
          {
            this.props.comment && !this.props.getDataError && !this.props.notFoundError ?
            <>
              <Comment
                comment={this.props.comment}
                userSignedIn={this.props.authUserData.userSignedIn}
                currUsername={this.props.authUserData.username}
                goToString={this.props.goToString}
                showDownvote={this.props.authUserData.showDownvote}
                showFavoriteOption={true}
                isModerator={this.props.authUserData.isModerator}
              />
              <CommentSection
                comments={this.props.comment.children}
                parentItemId={this.props.comment.parentItemId}
                isMore={this.props.isMoreChildrenComments}
                isMoreLink={`/comment?id=${this.props.comment.id}&page=${this.props.page + 1}`}
                userSignedIn={this.props.authUserData.userSignedIn}
                currUsername={this.props.authUserData.username}
                showDownvote={this.props.authUserData.showDownvote}
                goToString={this.props.goToString}
                isModerator={this.props.authUserData.isModerator}
              />
            </> :
            <div className="comment-get-data-error-msg">
              {
                this.props.notFoundError ?
                <span>No such comment.</span> :
                <span>An error occurred.</span>
              }
            </div>
          }
        </div>
        <Footer />
      </div>
    )
  }
}
