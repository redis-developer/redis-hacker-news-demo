import { Component } from "react"

import AlternateHeader from "../components/alternateHeader.js"
import HeadMetadata from "../components/headMetadata.js"
import Comment from "../components/comment.js"
import GoogleAnalytics from "../components/googleAnalytics.js"

import getReplyPageData from "../api/comments/getReplyPageData.js"

export default class extends Component {
  static async getInitialProps ({ req, query, res }) {
    const commentId = query.id ? query.id : ""

    const apiResult = await getReplyPageData(commentId, req)

    if (!apiResult.authUser.userSignedIn) {
      res.writeHead(302, {
        Location: `/login?goto=reply?id=${commentId}`
      })

      res.end()
    }

    return {
      comment: apiResult && apiResult.comment,
      authUserData: apiResult && apiResult.authUser ? apiResult.authUser : {},
      getDataError: apiResult && apiResult.getDataError,
      notFoundError: apiResult && apiResult.notFoundError,
      goToString: `reply?id=${commentId}`
    }
  }

  render () {
    return (
      <div className="layout-wrapper">
        <HeadMetadata
          title="Add Comment Reply | Hacker News"
        />
        <GoogleAnalytics />
        <AlternateHeader
          displayMessage="Reply to Comment"
        />
        <div className="comment-content-container">
          {
            !this.props.getDataError && !this.props.notFoundError ?
            <>
              <Comment
                comment={this.props.comment}
                userSignedIn={this.props.authUserData.userSignedIn}
                currUsername={this.props.authUserData.username}
                showDownvote={this.props.authUserData.showDownvote}
                goToString={this.props.goToString}
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
      </div>
    )
  }
}
