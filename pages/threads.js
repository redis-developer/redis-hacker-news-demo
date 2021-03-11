import { Component } from "react"

import Header from "../components/header.js"
import Footer from "../components/footer.js"
import HeadMetadata from "../components/headMetadata.js"
import CommentsList from "../components/commentsList.js"
import GoogleAnalytics from "../components/googleAnalytics.js"

import getUserCommentsByPage from "../api/comments/getUserCommentsByPage.js"

export default class extends Component {
  static async getInitialProps ({ req, query }) {
    const userId = query.id ? query.id : ""
    const page = query.page ? parseInt(query.page) : 1

    const apiResult = await getUserCommentsByPage(userId, page, req)

    return {
      comments: apiResult && apiResult.comments,
      authUserData: apiResult && apiResult.authUser ? apiResult.authUser : {},
      page: page,
      userId: userId,
      isMore: apiResult && apiResult.isMore,
      getDataError: apiResult && apiResult.getDataError,
      notFoundError: apiResult && apiResult.notFoundError,
      goToString: page > 1 ? `threads?id=${userId}&page=${page}` : `threads?id=${userId}`
    }
  }

  render() {
    return (
      <div className="layout-wrapper">
        <HeadMetadata
          title={!this.props.getDataError && !this.props.notFoundError ? `${this.props.userId}'s Comments | Hacker News` : "Hacker News"}
        />
        <GoogleAnalytics />
        <Header
          userSignedIn={this.props.authUserData && this.props.authUserData.userSignedIn}
          username={this.props.authUserData && this.props.authUserData.username}
          karma={this.props.authUserData && this.props.authUserData.karma}
          goto={this.props.goToString}
          pageName={this.props.authUserData.username === this.props.userId || this.props.notFoundError || this.props.getDataError ? "threads" : null}
          label={!this.props.notFoundError && !this.props.getDataError && this.props.authUserData.username !== this.props.userId ? `${this.props.userId}'s comments` : null}
        />
        <div className="comments-list-content-container">
          {
            !this.props.getDataError && !this.props.notFoundError ?
            <CommentsList
              comments={this.props.comments}
              userSignedIn={this.props.authUserData.userSignedIn}
              currUsername={this.props.authUserData.username}
              goToString={this.props.goToString}
              showDownvote={this.props.authUserData.showDownvote}
              isMoreLink={`/threads?id=${this.props.userId}&page=${this.props.page + 1}`}
              isMore={this.props.isMore}
              isModerator={this.props.authUserData.isModerator}
            /> :
            <div className="comments-list-error-msg">
              {
                this.props.notFoundError ?
                <span>User not found.</span> :
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
