import { Component } from "react"

import "../styles/pages/item.css"

import Header from "../components/header.js"
import Footer from "../components/footer.js"
import HeadMetadata from "../components/headMetadata.js"
import Item from "../components/item.js"
import CommentSection from "../components/commentSection.js"
import GoogleAnalytics from "../components/googleAnalytics.js"

import getItemById from "../api/items/getItemById.js"

export default class extends Component {
  static async getInitialProps ({ req, query }) {
    const itemId = query.id ? query.id : ""
    const page = query.page ? parseInt(query.page) : 1

    const apiResult = await getItemById(itemId, page, req)

    return {
      item: apiResult && apiResult.item,
      authUserData: apiResult && apiResult.authUser ? apiResult.authUser : {},
      getDataError: apiResult && apiResult.getDataError,
      notFoundError: apiResult && apiResult.notFoundError,
      goToString: page > 1 ? `item?id=${itemId}&page=${page}` : `item?id=${itemId}`,
      page: page,
      comments: apiResult && apiResult.comments,
      isMoreComments: apiResult && apiResult.isMoreComments
    }
  }

  render () {
    const item = this.props.item

    return (
      <div className="layout-wrapper">
        <HeadMetadata
          title={item ? `${item.title} | Hacker News` : "Hacker News"}
        />
        <GoogleAnalytics />
        <Header
          userSignedIn={this.props.authUserData && this.props.authUserData.userSignedIn}
          username={this.props.authUserData && this.props.authUserData.username}
          karma={this.props.authUserData && this.props.authUserData.karma}
          goto={this.props.goToString}
        />
        <div className="item-content-container">
          {
            item && !this.props.notFoundError && !this.props.getDataError ?
            <>
              <Item
                item={item}
                currUsername={this.props.authUserData.username}
                userSignedIn={this.props.authUserData.userSignedIn}
                goToString={this.props.goToString}
                isModerator={this.props.authUserData.isModerator}
              />
              <CommentSection
                comments={this.props.comments}
                parentItemId={item.id}
                isMore={this.props.isMoreComments}
                isMoreLink={`/item?id=${item.id}&page=${this.props.page + 1}`}
                userSignedIn={this.props.authUserData.userSignedIn}
                currUsername={this.props.authUserData.username}
                showDownvote={this.props.authUserData.showDownvote}
                goToString={this.props.goToString}
                isModerator={this.props.authUserData.isModerator}
              />
            </> :
            <div className="item-get-data-error-msg">
              {
                this.props.notFoundError ?
                <span>No such item.</span> :
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
