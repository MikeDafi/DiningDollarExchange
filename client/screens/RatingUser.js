import StarRating from 'react-native-star-rating';
import React from "react"
export default class RatingUser extends React.Component {
 
  state = {
      starCount: 0
  }
 
  onStarRatingPress(rating) {
    this.setState({
      starCount: rating
    });
  }
 
  render() {
    return (
      <StarRating
        disabled={false}
        emptyStar={'star'}
        fullStar={'star'}
        iconSet={'Entypo'}
        maxStars={5}
        rating={this.state.starCount}
        selectedStar={(rating) => this.onStarRatingPress(rating)}
        fullStarColor={'#FFE300'}
        emptyStarColor={'#676767'}
        starSize={20}
      />
    );
  }
}
 